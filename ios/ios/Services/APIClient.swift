import Foundation

// MARK: - Request/Response Models

struct VoiceRequest: Codable {
    let topicId: String
    let text: String

    enum CodingKeys: String, CodingKey {
        case topicId = "topic_id"
        case text
    }
}

struct TopicItem: Codable {
    let id: String
    let titleId: String
    let onairDate: String
    let headline: String
    let cornerStartTime: String?
    let cornerEndTime: String?
    let headlineGenre: String?

    enum CodingKeys: String, CodingKey {
        case id
        case titleId = "title_id"
        case onairDate = "onair_date"
        case headline
        case cornerStartTime = "corner_start_time"
        case cornerEndTime = "corner_end_time"
        case headlineGenre = "headline_genre"
    }
}

struct TopicListResponse: Codable {
    let items: [TopicItem]
}

// MARK: - SSE Event Types

struct GeneratedQuestion: Codable {
    let text: String
    let basedOnCount: Int
}

enum DialogStreamEvent {
    case questions([GeneratedQuestion])
    case dialog(question: String, speaker: String, text: String, source: String?)
    case done(sessionId: String)
    case error(code: String, message: String)
}

// MARK: - API Client

class APIClient {
    private let baseURL: URL

    init(baseURL: URL = URL(string: "http://localhost:8787")!) {
        self.baseURL = baseURL
    }

    // MARK: - トピック一覧取得

    func fetchTopics(titleId: String? = nil, onairDate: String? = nil) async throws -> [TopicItem] {
        var components = URLComponents(url: baseURL.appendingPathComponent("api/topics"), resolvingAgainstBaseURL: false)!
        var queryItems: [URLQueryItem] = []
        if let titleId { queryItems.append(URLQueryItem(name: "title_id", value: titleId)) }
        if let onairDate { queryItems.append(URLQueryItem(name: "onair_date", value: onairDate)) }
        if !queryItems.isEmpty { components.queryItems = queryItems }

        var request = URLRequest(url: components.url!)
        request.timeoutInterval = 2
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(TopicListResponse.self, from: data)
        return response.items
    }

    // MARK: - 視聴者の声を送信

    func postVoice(topicId: String, text: String) async throws {
        let url = baseURL.appendingPathComponent("api/voice")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(VoiceRequest(topicId: topicId, text: text))

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 201 else {
            throw APIError.requestFailed
        }
    }

    // MARK: - AI対話SSEストリーム (POST /api/dialog/start)

    func streamDialog(topicId: String) -> AsyncThrowingStream<DialogStreamEvent, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    let url = baseURL.appendingPathComponent("api/dialog/start")
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.httpBody = try JSONEncoder().encode(VoiceRequest.DialogStartBody(topicId: topicId))

                    let (bytes, response) = try await URLSession.shared.bytes(for: request)

                    guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                        continuation.finish(throwing: APIError.requestFailed)
                        return
                    }

                    var currentEvent: String?

                    for try await line in bytes.lines {
                        if line.hasPrefix("event: ") {
                            currentEvent = String(line.dropFirst(7))
                        } else if line.hasPrefix("data: ") {
                            let jsonString = String(line.dropFirst(6))
                            guard let data = jsonString.data(using: .utf8),
                                  let eventType = currentEvent else { continue }

                            switch eventType {
                            case "questions":
                                let parsed = try JSONDecoder().decode(QuestionsData.self, from: data)
                                continuation.yield(.questions(parsed.questions))
                            case "dialog":
                                let parsed = try JSONDecoder().decode(DialogData.self, from: data)
                                continuation.yield(.dialog(
                                    question: parsed.question,
                                    speaker: parsed.speaker,
                                    text: parsed.text,
                                    source: parsed.source
                                ))
                            case "done":
                                let parsed = try JSONDecoder().decode(DoneData.self, from: data)
                                continuation.yield(.done(sessionId: parsed.sessionId))
                            case "error":
                                let parsed = try JSONDecoder().decode(ErrorData.self, from: data)
                                continuation.yield(.error(code: parsed.code, message: parsed.message))
                            default:
                                break
                            }

                            currentEvent = nil
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - TTS音声取得 (ElevenLabs)

    func fetchTTSAudio(text: String, speaker: String = "sorajiro") async throws -> Data {
        let url = baseURL.appendingPathComponent("api/tts/synthesis")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = ["text": text, "speaker": speaker]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
        return data
    }
}

// MARK: - Internal Codable Types

private extension APIClient {
    struct QuestionsData: Codable {
        let questions: [GeneratedQuestion]
    }

    struct DialogData: Codable {
        let question: String
        let speaker: String
        let text: String
        let source: String?
    }

    struct DoneData: Codable {
        let sessionId: String

        enum CodingKeys: String, CodingKey {
            case sessionId = "session_id"
        }
    }

    struct ErrorData: Codable {
        let code: String
        let message: String
    }
}

private extension VoiceRequest {
    struct DialogStartBody: Codable {
        let topicId: String

        enum CodingKeys: String, CodingKey {
            case topicId = "topic_id"
        }
    }
}

enum APIError: Error {
    case requestFailed
    case invalidResponse
}

extension TopicItem {
    static let mockData: [TopicItem] = [
        TopicItem(id: "mock-1", titleId: "mock", onairDate: "2026-03-29", headline: "【プレビュー用】サンプルトピック", cornerStartTime: nil, cornerEndTime: nil, headlineGenre: nil)
    ]
}
