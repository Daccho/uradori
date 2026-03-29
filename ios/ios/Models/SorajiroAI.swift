import Foundation

@Observable
class SorajiroAI {
    var messages: [DialogMessage] = []
    var questions: [GeneratedQuestion] = []
    var isStreaming = false
    var sessionId: String?
    var errorMessage: String?

    private let apiClient = APIClient()

    func startDialog(topicId: String, playbackController: DialogPlaybackController) async {
        isStreaming = true
        errorMessage = nil
        defer { isStreaming = false }

        do {
            for try await event in apiClient.streamDialog(topicId: topicId) {
                switch event {
                case .questions(let generatedQuestions):
                    questions = generatedQuestions
                case .dialog(_, let speaker, let text, let source):
                    let dialogSpeaker: DialogMessage.Speaker = speaker == "sorajiro" ? .sorajiro : .audience
                    let dialogMessage = DialogMessage(
                        speaker: dialogSpeaker,
                        text: text,
                        source: source.flatMap { DialogMessage.InfoSource(rawValue: $0) }
                    )
                    messages.append(dialogMessage)
                    playbackController.enqueue(text: text, speaker: dialogSpeaker)
                case .done(let id):
                    sessionId = id
                case .error(let code, let message):
                    errorMessage = "対話エラー: \(message) (\(code))"
                }
            }
        } catch {
            errorMessage = "対話の接続に失敗しました"
        }
    }

}
