import SwiftUI
import RealityKit
import RealityKitContent

struct ImmersiveView: View {
    @Environment(SorajiroAI.self) private var sorajiroAI
    @Environment(AudienceAI.self) private var audienceAI

    @State private var floatingVoices: [FloatingVoice] = []

    var body: some View {
        RealityView { content, attachments in
            // スタジオ空間のルート
            let root = Entity()
            root.name = "StudioRoot"

            // 床（ステージ）
            let floor = createStageFloor()
            root.addChild(floor)

            // ソラジローAIアバター（中央奥に配置）
            let avatar = createSorajiroAvatar()
            avatar.name = "SorajiroAvatar"
            avatar.position = [0, 1.2, -2.0]
            root.addChild(avatar)

            // アバターラベル
            if let label = attachments.entity(for: "avatar-label") {
                label.position = [0, 0.35, 0]
                avatar.addChild(label)
            }

            // 対話パネル（アバターの横）
            if let dialogPanel = attachments.entity(for: "dialog-panel") {
                dialogPanel.position = [0.8, 1.2, -1.8]
                root.addChild(dialogPanel)
            }

            content.add(root)
        } update: { content, attachments in
            // 視聴者の声フローティング更新
            guard let root = content.entities.first(where: { $0.name == "StudioRoot" }) else { return }

            // 既存のフローティング要素を削除
            for child in root.children where child.name.hasPrefix("voice-") {
                child.removeFromParent()
            }

            // 新しいフローティング要素を追加
            for voice in floatingVoices {
                if let entity = attachments.entity(for: voice.id) {
                    entity.position = voice.position
                    entity.name = "voice-\(voice.id)"
                    root.addChild(entity)
                }
            }
        } attachments: {
            // アバターラベル
            Attachment(id: "avatar-label") {
                Text("ソラジロー AI")
                    .font(.title3)
                    .bold()
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .glassBackgroundEffect()
            }

            // 対話パネル
            Attachment(id: "dialog-panel") {
                DialogPanelView(messages: sorajiroAI.messages, questions: sorajiroAI.questions)
                    .frame(width: 500, height: 600)
                    .glassBackgroundEffect()
            }

            // 視聴者の声フローティング
            ForEach(floatingVoices) { voice in
                Attachment(id: voice.id) {
                    FloatingVoiceBubble(text: voice.text)
                }
            }
        }
        .onChange(of: sorajiroAI.messages.count) {
            addFloatingVoice(from: sorajiroAI.messages.last)
        }
        .onChange(of: audienceAI.messages.count) {
            addFloatingVoice(from: audienceAI.messages.last)
        }
    }

    // MARK: - 3Dエンティティ生成

    private func createStageFloor() -> Entity {
        let mesh = MeshResource.generatePlane(width: 6, depth: 4)
        var material = SimpleMaterial()
        material.color = .init(tint: .init(white: 0.15, alpha: 0.6))
        let floor = ModelEntity(mesh: mesh, materials: [material])
        floor.position = [0, 0, -2.0]
        return floor
    }

    private func createSorajiroAvatar() -> Entity {
        let parent = Entity()

        // 胴体
        let bodyMesh = MeshResource.generateSphere(radius: 0.2)
        var bodyMaterial = SimpleMaterial()
        bodyMaterial.color = .init(tint: .init(red: 0.2, green: 0.6, blue: 1.0, alpha: 1.0))
        let body = ModelEntity(mesh: bodyMesh, materials: [bodyMaterial])
        parent.addChild(body)

        // 頭
        let headMesh = MeshResource.generateSphere(radius: 0.15)
        var headMaterial = SimpleMaterial()
        headMaterial.color = .init(tint: .init(red: 0.3, green: 0.7, blue: 1.0, alpha: 1.0))
        let head = ModelEntity(mesh: headMesh, materials: [headMaterial])
        head.position = [0, 0.28, 0]
        parent.addChild(head)

        return parent
    }

    // MARK: - 視聴者の声演出

    private func addFloatingVoice(from message: DialogMessage?) {
        guard let message, message.speaker == .audience else { return }

        let voice = FloatingVoice(
            text: message.text,
            position: randomFloatingPosition()
        )
        floatingVoices.append(voice)

        // 一定時間後にフェードアウト
        Task {
            try? await Task.sleep(for: .seconds(8))
            floatingVoices.removeAll { $0.id == voice.id }
        }
    }

    private func randomFloatingPosition() -> SIMD3<Float> {
        let x = Float.random(in: -1.5...1.5)
        let y = Float.random(in: 1.0...2.2)
        let z = Float.random(in: -2.5 ... -1.0)
        return [x, y, z]
    }
}

// MARK: - Supporting Types

struct FloatingVoice: Identifiable {
    let id = UUID().uuidString
    let text: String
    let position: SIMD3<Float>
}

struct FloatingVoiceBubble: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.caption)
            .lineLimit(2)
            .padding(8)
            .frame(maxWidth: 200)
            .glassBackgroundEffect()
    }
}

// MARK: - Dialog Panel (空間内)

struct DialogPanelView: View {
    let messages: [DialogMessage]
    let questions: [GeneratedQuestion]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("AI対話")
                .font(.headline)
                .padding(.bottom, 4)

            if !questions.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("視聴者の質問")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    ForEach(Array(questions.enumerated()), id: \.offset) { _, q in
                        Label(q.text, systemImage: "bubble.left")
                            .font(.caption)
                    }
                }
                Divider()
            }

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 8) {
                    ForEach(messages) { message in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: message.speaker == .sorajiro ? "person.circle.fill" : "person.2.circle")
                                .foregroundStyle(message.speaker == .sorajiro ? .blue : .green)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(message.speaker.rawValue)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                Text(message.text)
                                    .font(.caption)
                                if let source = message.source {
                                    Text(source.displayName)
                                        .font(.caption2)
                                        .foregroundStyle(.tertiary)
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding()
    }
}

#Preview(immersionStyle: .mixed) {
    ImmersiveView()
        .environment(SorajiroAI())
        .environment(AudienceAI())
}
