import Foundation

struct SorajiroResponse: Codable {
    let speaker: String
    let text: String
    let source: String?
}

@Observable
class SorajiroAI {
    var messages: [DialogMessage] = []
    var isStreaming = false

    private let apiClient = APIClient()

    func startDialog(topicId: String, message: String) async {
        isStreaming = true
        defer { isStreaming = false }

        do {
            for try await event in apiClient.streamSorajiroAI(topicId: topicId, message: message) {
                let dialogMessage = DialogMessage(
                    speaker: .sorajiro,
                    text: event.text,
                    source: parseSource(event.source)
                )
                messages.append(dialogMessage)
            }
        } catch {
            print("SorajiroAI stream error: \(error)")
        }
    }

    func speak(text: String) async {
        do {
            let audioData = try await apiClient.fetchVoicevoxAudio(text: text)
            try await playAudio(data: audioData)
        } catch {
            print("VOICEVOX audio error: \(error)")
        }
    }

    private func playAudio(data: Data) async throws {
        let player = try AVAudioPlayer(data: data)
        player.play()
    }

    private func parseSource(_ source: String?) -> DialogMessage.InfoSource? {
        guard let source else { return nil }
        return DialogMessage.InfoSource(rawValue: source)
    }
}

import AVFoundation
