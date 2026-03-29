import RealityKit
import AVFoundation
import UIKit
6233
struct StudioEnvironmentBuilder {

    // MARK: - 動画背景球体

    /// 半径10mの球体内側に動画を投影し、ユーザーを映像空間で包み込む
    static func buildVideoSphere(player: AVPlayer) -> Entity {
        let sphere = ModelEntity(
            mesh: .generateSphere(radius: 10),
            materials: [SimpleMaterial(color: .init(white: 0.05, alpha: 1.0), isMetallic: false)]
        )
        sphere.name = "VideoSphere"
        // 法線を反転して内側にレンダリング
        sphere.scale = [-1, 1, 1]
        sphere.position = [0, 1.5, 0]

        // 動画プレイヤーコンポーネントを設定
        sphere.components.set(VideoPlayerComponent(avPlayer: player))

        return sphere
    }

    /// 動画URLが無い場合の待機用ダーク球体
    static func buildStandbySphere() -> Entity {
        var material = SimpleMaterial()
        material.color = .init(tint: .init(white: 0.03, alpha: 1.0))

        let sphere = ModelEntity(
            mesh: .generateSphere(radius: 10),
            materials: [material]
        )
        sphere.name = "VideoSphere"
        sphere.scale = [-1, 1, 1]
        sphere.position = [0, 1.5, 0]

        return sphere
    }

    // MARK: - ステージプラットフォーム

    /// アバターが立つ半透明の円形ステージ
    static func buildStagePlatform() -> Entity {
        let platform = Entity()
        platform.name = "StagePlatform"

        // 円形プラットフォーム
        let cylinder = ModelEntity(
            mesh: .generateCylinder(height: 0.05, radius: 2.5),
            materials: [SimpleMaterial(color: .init(white: 0.2, alpha: 0.4), isMetallic: false)]
        )
        cylinder.position = [0, 0, -2.0]
        platform.addChild(cylinder)

        return platform
    }

    // MARK: - スタジオ照明

    /// アバターを照らすライティング
    static func buildStudioLighting() -> Entity {
        let lights = Entity()
        lights.name = "StudioLights"

        // キーライト（上方から）
        let keyLight = Entity()
        keyLight.components.set(PointLightComponent(
            color: .init(red: 0.95, green: 0.93, blue: 0.88, alpha: 1.0),
            intensity: 1500,
            attenuationRadius: 8.0
        ))
        keyLight.position = [0, 3.0, -1.5]
        lights.addChild(keyLight)

        // 左アクセントライト
        let leftFill = Entity()
        leftFill.components.set(PointLightComponent(
            color: .init(red: 0.85, green: 0.88, blue: 1.0, alpha: 1.0),
            intensity: 500,
            attenuationRadius: 5.0
        ))
        leftFill.position = [-1.5, 2.5, -2.0]
        lights.addChild(leftFill)

        // 右アクセントライト
        let rightFill = Entity()
        rightFill.components.set(PointLightComponent(
            color: .init(red: 0.85, green: 0.88, blue: 1.0, alpha: 1.0),
            intensity: 500,
            attenuationRadius: 5.0
        ))
        rightFill.position = [1.5, 2.5, -2.0]
        lights.addChild(rightFill)

        return lights
    }
}
