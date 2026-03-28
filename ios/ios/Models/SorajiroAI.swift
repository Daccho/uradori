import Foundation
import AVFoundation

@Observable
class SorajiroAI {
    var messages: [DialogMessage] = []
    var questions: [GeneratedQuestion] = []
    var isStreaming = false
    var sessionId: String?
    var errorMessage: String?

    private let apiClient = APIClient()
    private var audioPlayer: AVAudioPlayer?

    func startDialog(topicId: String) async {
        isStreaming = true
        errorMessage = nil
        defer { isStreaming = false }

        do {
            for try await event in apiClient.streamDialog(topicId: topicId) {
                switch event {
                case .questions(let generatedQuestions):
                    questions = generatedQuestions
                case .dialog(_, let speaker, let text, let source):
                    let dialogMessage = DialogMessage(
                        speaker: speaker == "sorajiro" ? .sorajiro : .audience,
                        text: text,
                        source: source.flatMap { DialogMessage.InfoSource(rawValue: $0) }
                    )
                    messages.append(dialogMessage)
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

    func speak(text: String) async {
        do {
            let audioData = try await apiClient.fetchVoicevoxAudio(text: text)
            try playAudio(data: audioData)
        } catch {
            print("VOICEVOX audio error: \(error)")
        }
    }

    private func playAudio(data: Data) throws {
        audioPlayer = try AVAudioPlayer(data: data)
        audioPlayer?.play()
    }
}
