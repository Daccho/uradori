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
    @State private var topics: [TopicItem] = []
    @State private var selectedTopic: TopicItem?
    @State private var errorMessage: String?

    private let apiClient = APIClient()

    var body: some View {
        VStack {
            // トピック選択
            if selectedTopic == nil {
                TopicListSection(topics: topics) { topic in
                    selectedTopic = topic
                }
            } else {
                HStack {
                    Text(selectedTopic!.headline)
                        .font(.headline)
                    Spacer()
                    Button("変更") { selectedTopic = nil }
                        .buttonStyle(.bordered)
                }
                .padding(.horizontal)

                DialogView(messages: sorajiroAI.messages + audienceAI.messages)
                    .frame(maxHeight: .infinity)

                VoiceInputView(speechService: speechService) { text in
                    guard let topicId = selectedTopic?.id else { return }
                    Task {
                        await audienceAI.submitVoice(topicId: topicId, text: text)
                    }
                }

                HStack(spacing: 12) {
                    Button("対話開始") {
                        guard let topicId = selectedTopic?.id else { return }
                        Task {
                            await sorajiroAI.startDialog(topicId: topicId)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(sorajiroAI.isStreaming)

                    Toggle("没入モード", isOn: $isImmersiveSpaceOpen)
                        .toggleStyle(.button)
                }
                .padding()
            }
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
        .alert("エラー", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
        .onChange(of: sorajiroAI.errorMessage) { _, msg in
            if let msg { errorMessage = msg; sorajiroAI.errorMessage = nil }
        }
        .onChange(of: audienceAI.errorMessage) { _, msg in
            if let msg { errorMessage = msg; audienceAI.errorMessage = nil }
        }
        .task {
            await speechService.requestAuthorization()
            do {
                topics = try await apiClient.fetchTopics()
            } catch {
                errorMessage = "トピックの取得に失敗しました"
            }
        }
    }
}

struct TopicListSection: View {
    let topics: [TopicItem]
    let onSelect: (TopicItem) -> Void

    var body: some View {
        if topics.isEmpty {
            ContentUnavailableView("トピックがありません", systemImage: "tray")
        } else {
            List(topics, id: \.id) { topic in
                Button {
                    onSelect(topic)
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(topic.headline)
                            .font(.headline)
                        Text(topic.onairDate)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}

#Preview(windowStyle: .automatic) {
    ContentView()
        .environment(SorajiroAI())
        .environment(AudienceAI())
        .environment(SpeechService())
}
