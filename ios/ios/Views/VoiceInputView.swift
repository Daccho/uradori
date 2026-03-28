import SwiftUI

struct VoiceInputView: View {
    @State private var inputText = ""
    @State private var isRecording = false
    var onSubmit: (String) -> Void

    var body: some View {
        HStack(spacing: 12) {
            TextField("意見を入力...", text: $inputText)
                .textFieldStyle(.roundedBorder)

            Button {
                isRecording.toggle()
            } label: {
                Image(systemName: isRecording ? "mic.fill" : "mic")
                    .foregroundStyle(isRecording ? .red : .primary)
                    .font(.title2)
            }

            Button("送信") {
                guard !inputText.isEmpty else { return }
                onSubmit(inputText)
                inputText = ""
            }
            .buttonStyle(.borderedProminent)
            .disabled(inputText.isEmpty)
        }
        .padding()
    }
}

#Preview {
    VoiceInputView { text in
        print(text)
    }
}
