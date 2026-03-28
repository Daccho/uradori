import Foundation

struct SSEEvent {
    let speaker: String
    let text: String
    let source: String?
}

struct VoiceRequest: Codable {
    let topicId: String
    let text: String
}

struct VoiceResponse: Codable {
    let ok: Bool
}

struct AudienceSummaryResponse: Codable {
    let summary: String
    let voiceCount: Int
}

class APIClient {
    private let baseURL: URL

    init(baseURL: URL = URL(string: "https://uradori-worker.example.com")!) {
        self.baseURL = baseURL
    }

    // MARK: - 視聴者の声を送信

    func postVoice(topicId: String, text: String) async throws {
        let url = baseURL.appendingPathComponent("api/voice")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(VoiceRequest(topicId: topicId, text: text))

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
    }

    // MARK: - 視聴者集約AI取得

    func fetchAudienceAI(topicId: String) async throws -> AudienceSummary {
        let url = baseURL.appendingPathComponent("api/audience-ai/\(topicId)")
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(AudienceSummary.self, from: data)
    }

    // MARK: - ソラジローAI SSEストリーム

    func streamSorajiroAI(topicId: String, message: String) -> AsyncThrowingStream<SSEEvent, Error> {
        AsyncThrowingStream { continuation in
            Task {
                var components = URLComponents(url: baseURL.appendingPathComponent("api/sorajiro-ai/stream"), resolvingAgainstBaseURL: false)!
                components.queryItems = [
                    URLQueryItem(name: "topicId", value: topicId),
                    URLQueryItem(name: "message", value: message),
                ]

                let (bytes, _) = try await URLSession.shared.bytes(from: components.url!)

                for try await line in bytes.lines {
                    guard line.hasPrefix("data: ") else { continue }
                    let jsonString = String(line.dropFirst(6))
                    guard let data = jsonString.data(using: .utf8) else { continue }

                    let event = try JSONDecoder().decode(SorajiroResponse.self, from: data)
                    continuation.yield(SSEEvent(speaker: event.speaker, text: event.text, source: event.source))
                }
                continuation.finish()
            }
        }
    }

    // MARK: - VOICEVOX音声取得

    func fetchVoicevoxAudio(text: String, speakerId: Int = 1) async throws -> Data {
        var components = URLComponents(url: baseURL.appendingPathComponent("api/voicevox/synthesis"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "text", value: text),
            URLQueryItem(name: "speaker", value: String(speakerId)),
        ]

        let (data, response) = try await URLSession.shared.data(from: components.url!)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
        return data
    }

    // MARK: - WebSocket接続

    func connectWebSocket(sessionId: String) -> URLSessionWebSocketTask {
        let wsURL = baseURL
            .appendingPathComponent("api/dialog/\(sessionId)")
        var request = URLRequest(url: wsURL)
        request.setValue("websocket", forHTTPHeaderField: "Upgrade")

        let task = URLSession.shared.webSocketTask(with: request)
        task.resume()
        return task
    }
}

enum APIError: Error {
    case requestFailed
    case invalidResponse
}
