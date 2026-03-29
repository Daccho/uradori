//
//  iosApp.swift
//  ios
//
//  Created by Kotaro Ueda on 2026/03/28.
//

import SwiftUI

@main
struct iosApp: App {
    @State private var sorajiroAI = SorajiroAI()
    @State private var audienceAI = AudienceAI()
    @State private var speechService = SpeechService()
    @State private var dialogPlaybackController = DialogPlaybackController()
    @State private var videoPlayerManager = VideoPlayerManager()
    @State private var immersionStyle: ImmersionStyle = .full

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(sorajiroAI)
                .environment(audienceAI)
                .environment(speechService)
                .environment(dialogPlaybackController)
                .environment(videoPlayerManager)
        }

        ImmersiveSpace(id: "ImmersiveSpace") {
            ImmersiveView()
                .environment(sorajiroAI)
                .environment(audienceAI)
                .environment(dialogPlaybackController)
                .environment(videoPlayerManager)
        }
        .immersionStyle(selection: $immersionStyle, in: .full)
    }
}
