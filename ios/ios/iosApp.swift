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

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(sorajiroAI)
                .environment(audienceAI)
                .environment(speechService)
        }

        ImmersiveSpace(id: "ImmersiveSpace") {
            ImmersiveView()
                .environment(sorajiroAI)
        }
    }
}
