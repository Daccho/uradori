import SwiftUI
import RealityKit
import RealityKitContent

struct ImmersiveView: View {
    @Environment(SorajiroAI.self) private var sorajiroAI
    @Environment(AudienceAI.self) private var audienceAI
    @Environment(DialogPlaybackController.self) private var dialogPlaybackController

    @State private var floatingVoices: [FloatingVoice] = []
    @State private var studioRoot: Entity?

    var body: some View {
        RealityView { content, attachments in
            // スタジオ空間のルート
            let root = Entity()
            root.name = "StudioRoot"

            // 床（ステージ）
            let floor = createStageFloor()
            root.addChild(floor)

            // ソラジローAIアバター（左側に配置）
            let sorajiroAvatar = await createSorajiroAvatar()
            sorajiroAvatar.name = "SorajiroAvatar"
            sorajiroAvatar.position = [-0.7, 1.2, -2.0]
            sorajiroAvatar.orientation = simd_quatf(angle: 0.26, axis: [0, 1, 0])
            root.addChild(sorajiroAvatar)

            // ソラジローラベル
            if let label = attachments.entity(for: "avatar-label") {
                label.position = [0, 0.35, 0]
                sorajiroAvatar.addChild(label)
            }

            // 視聴者代表AIアバター（右側に配置）
            let viewerAvatar = await createViewerAvatar()
            viewerAvatar.name = "ViewerRepAvatar"
            viewerAvatar.position = [0.7, 1.2, -2.0]
            viewerAvatar.orientation = simd_quatf(angle: -0.26, axis: [0, 1, 0])
            root.addChild(viewerAvatar)

            // 視聴者代表ラベル
            if let viewerLabel = attachments.entity(for: "viewer-avatar-label") {
                viewerLabel.position = [0, 0.35, 0]
                viewerAvatar.addChild(viewerLabel)
            }

            // 対話パネル（中央手前に配置）
            if let dialogPanel = attachments.entity(for: "dialog-panel") {
                dialogPanel.position = [0, 1.2, -1.5]
                root.addChild(dialogPanel)
            }

            content.add(root)
            studioRoot = root
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

            // 視聴者代表ラベル
            Attachment(id: "viewer-avatar-label") {
                Text("視聴者代表 AI")
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
        .onChange(of: dialogPlaybackController.currentSpeaker) {
            guard let root = studioRoot else { return }
            let sorajiroEntity = root.children.first { $0.name == "SorajiroAvatar" }
            let viewerEntity = root.children.first { $0.name == "ViewerRepAvatar" }

            let isSorajiroSpeaking = dialogPlaybackController.currentSpeaker == .sorajiro
            let isViewerSpeaking = dialogPlaybackController.currentSpeaker == .audience

            if let entity = sorajiroEntity {
                var transform = entity.transform
                transform.scale = isSorajiroSpeaking ? [1.05, 1.05, 1.05] : [1.0, 1.0, 1.0]
                entity.move(to: transform, relativeTo: entity.parent, duration: 0.3)
            }
            if let entity = viewerEntity {
                var transform = entity.transform
                transform.scale = isViewerSpeaking ? [1.05, 1.05, 1.05] : [1.0, 1.0, 1.0]
                entity.move(to: transform, relativeTo: entity.parent, duration: 0.3)
            }
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

    private func createSorajiroAvatar() async -> Entity {
        do {
            let entity = try await Entity(named: "Sorajiro", in: realityKitContentBundle)
            // アニメーションがあれば再生
            if let animation = entity.availableAnimations.first {
                entity.playAnimation(animation.repeat())
            }
            return entity
        } catch {
            print("Failed to load Sorajiro model: \(error)")
            return createFallbackAvatar()
        }
    }

    private func createFallbackAvatar(color: UIColor = .init(red: 0.2, green: 0.6, blue: 1.0, alpha: 1.0),
                                       headColor: UIColor = .init(red: 0.3, green: 0.7, blue: 1.0, alpha: 1.0)) -> Entity {
        let parent = Entity()

        // 胴体
        let bodyMesh = MeshResource.generateSphere(radius: 0.2)
        var bodyMaterial = SimpleMaterial()
        bodyMaterial.color = .init(tint: color)
        let body = ModelEntity(mesh: bodyMesh, materials: [bodyMaterial])
        parent.addChild(body)

        // 頭
        let headMesh = MeshResource.generateSphere(radius: 0.15)
        var headMaterial = SimpleMaterial()
        headMaterial.color = .init(tint: headColor)
        let head = ModelEntity(mesh: headMesh, materials: [headMaterial])
        head.position = [0, 0.28, 0]
        parent.addChild(head)

        return parent
    }

    private func createViewerAvatar() async -> Entity {
        do {
            let entity = try await Entity(named: "shichosha", in: realityKitContentBundle)
            if let animation = entity.availableAnimations.first {
                entity.playAnimation(animation.repeat())
            }
            return entity
        } catch {
            print("Failed to load shichosha model: \(error)")
            return createFallbackAvatar(
                color: .init(red: 0.2, green: 0.85, blue: 0.4, alpha: 1.0),
                headColor: .init(red: 0.3, green: 0.9, blue: 0.5, alpha: 1.0)
            )
        }
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
        .environment(DialogPlaybackController())
}
