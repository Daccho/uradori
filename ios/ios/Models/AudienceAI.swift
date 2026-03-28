import Foundation

@Observable
class AudienceAI {
    var messages: [DialogMessage] = []
    var errorMessage: String?

    private let apiClient = APIClient()

    func submitVoice(topicId: String, text: String) async {
        errorMessage = nil
        do {
            try await apiClient.postVoice(topicId: topicId, text: text)
            let message = DialogMessage(speaker: .audience, text: text, source: nil)
            messages.append(message)
        } catch {
            errorMessage = "意見の送信に失敗しました"
        }
    }
}
