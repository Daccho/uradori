import Foundation

struct AudienceSummary: Codable {
    let summary: String
    let voiceCount: Int
}

@Observable
class AudienceAI {
    var summary: AudienceSummary?
    var messages: [DialogMessage] = []

    private let apiClient = APIClient()

    func fetchSummary(topicId: String) async {
        do {
            summary = try await apiClient.fetchAudienceAI(topicId: topicId)
        } catch {
            print("AudienceAI fetch error: \(error)")
        }
    }

    func submitVoice(topicId: String, text: String) async {
        do {
            try await apiClient.postVoice(topicId: topicId, text: text)
            let message = DialogMessage(speaker: .audience, text: text, source: nil)
            messages.append(message)
        } catch {
            print("Voice submit error: \(error)")
        }
    }
}
