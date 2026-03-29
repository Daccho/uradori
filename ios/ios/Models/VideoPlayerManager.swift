import AVFoundation

@Observable
class VideoPlayerManager {
    private(set) var player: AVPlayer
    var isPlaying = false
    var currentURL: URL?

    init() {
        self.player = AVPlayer()
    }

    func loadVideo(url: URL) {
        let playerItem = AVPlayerItem(url: url)
        player.replaceCurrentItem(with: playerItem)
        currentURL = url
    }

    func play() {
        player.play()
        isPlaying = true
    }

    func pause() {
        player.pause()
        isPlaying = false
    }

    func stop() {
        player.pause()
        player.seek(to: .zero)
        isPlaying = false
    }
}
