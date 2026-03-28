//
//  ContentView.swift
//  ios
//
//  Created by Kotaro Ueda on 2026/03/28.
//

import SwiftUI
import RealityKit
import RealityKitContent

struct ContentView: View {
    @Environment(SorajiroAI.self) private var sorajiroAI
    @Environment(AudienceAI.self) private var audienceAI
    @Environment(SpeechService.self) private var speechService
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace

    @State private var isImmersiveSpaceOpen = false

    var body: some View {
        VStack {
            DialogView(messages: sorajiroAI.messages + audienceAI.messages)
                .frame(maxHeight: .infinity)

            VoiceInputView { text in
                Task {
                    await audienceAI.submitVoice(topicId: "demo", text: text)
                }
            }

            Toggle("没入モード", isOn: $isImmersiveSpaceOpen)
                .toggleStyle(.button)
                .padding()
        }
        .padding()
        .onChange(of: isImmersiveSpaceOpen) { _, isOpen in
            Task {
                if isOpen {
                    await openImmersiveSpace(id: "ImmersiveSpace")
                } else {
                    await dismissImmersiveSpace()
                }
            }
        }
        .task {
            await speechService.requestAuthorization()
        }
    }
}

#Preview(windowStyle: .automatic) {
    ContentView()
        .environment(SorajiroAI())
        .environment(AudienceAI())
        .environment(SpeechService())
}
