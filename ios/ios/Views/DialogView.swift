import SwiftUI

struct DialogMessage: Identifiable {
    let id = UUID()
    let speaker: Speaker
    let text: String
    let source: InfoSource?

    enum Speaker: String {
        case sorajiro = "ソラジロー"
        case audience = "視聴者代表"
    }

    enum InfoSource: String {
        case broadcast = "放送情報"
        case unaired = "未放送素材"
        case opendata = "オープンデータ"
    }
}

struct DialogView: View {
    let messages: [DialogMessage]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 12) {
                ForEach(messages) { message in
                    DialogBubble(message: message)
                }
            }
            .padding()
        }
    }
}

struct DialogBubble: View {
    let message: DialogMessage

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(message.speaker.rawValue)
                .font(.caption)
                .foregroundStyle(.secondary)

            Text(message.text)
                .padding(12)
                .background(
                    message.speaker == .sorajiro
                        ? Color.blue.opacity(0.15)
                        : Color.green.opacity(0.15)
                )
                .clipShape(RoundedRectangle(cornerRadius: 12))

            if let source = message.source {
                Label(source.rawValue, systemImage: sourceIcon(source))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func sourceIcon(_ source: DialogMessage.InfoSource) -> String {
        switch source {
        case .broadcast: "tv"
        case .unaired: "folder"
        case .opendata: "globe"
        }
    }
}

#Preview {
    DialogView(messages: [
        DialogMessage(speaker: .sorajiro, text: "取材では放送で伝えきれなかった詳細があります。", source: .unaired),
        DialogMessage(speaker: .audience, text: "もっと詳しく知りたいです。", source: nil),
    ])
}
