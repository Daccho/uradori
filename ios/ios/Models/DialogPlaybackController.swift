import Foundation
import AVFoundation

@Observable
class DialogPlaybackController: NSObject, AVAudioPlayerDelegate {
    var isSpeaking = false
    var currentSpeaker: DialogMessage.Speaker?

    private let apiClient = APIClient()
    private var audioPlayer: AVAudioPlayer?
    private var playbackQueue: [(text: String, speaker: DialogMessage.Speaker)] = []
    private var isProcessing = false
    private var playbackContinuation: CheckedContinuation<Void, Never>?

    func enqueue(text: String, speaker: DialogMessage.Speaker) {
        playbackQueue.append((text: text, speaker: speaker))
        processQueueIfNeeded()
    }

    func stop() {
        playbackQueue.removeAll()
        audioPlayer?.stop()
        if let continuation = playbackContinuation {
            continuation.resume()
            playbackContinuation = nil
        }
        isSpeaking = false
        currentSpeaker = nil
        isProcessing = false
    }

    private func processQueueIfNeeded() {
        guard !isProcessing, !playbackQueue.isEmpty else { return }
        isProcessing = true
        Task { await processQueue() }
    }

    private func processQueue() async {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .default)
            try audioSession.setActive(true)
        } catch {
            print("AVAudioSession setup error: \(error)")
        }

        while !playbackQueue.isEmpty {
            let item = playbackQueue.removeFirst()
            isSpeaking = true
            currentSpeaker = item.speaker

            let speakerParam = item.speaker == .sorajiro ? "sorajiro" : "audience"

            do {
                let audioData = try await apiClient.fetchTTSAudio(
                    text: item.text,
                    speaker: speakerParam
                )
                audioPlayer = try AVAudioPlayer(data: audioData)
                audioPlayer?.delegate = self
                audioPlayer?.play()

                await withCheckedContinuation { continuation in
                    playbackContinuation = continuation
                }
            } catch {
                print("TTS playback error: \(error)")
            }
        }

        isSpeaking = false
        currentSpeaker = nil
        isProcessing = false
    }

    // MARK: - AVAudioPlayerDelegate

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully: Bool) {
        playbackContinuation?.resume()
        playbackContinuation = nil
    }
}
