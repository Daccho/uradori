import SwiftUI

struct VoiceInputView: View {
    @State private var inputText = ""
    @State private var recordingError: String?
    var speechService: SpeechService
    var onSubmit: (String) -> Void

    private let maxCharacters = 500

    private var isOverLimit: Bool {
        inputText.count > maxCharacters
    }

    var body: some View {
        VStack(alignment: .trailing, spacing: 4) {
            HStack(spacing: 12) {
                TextField("意見を入力...", text: $inputText)
                    .textFieldStyle(.roundedBorder)

                Button {
                    toggleRecording()
                } label: {
                    Image(systemName: speechService.isRecording ? "mic.fill" : "mic")
                        .foregroundStyle(speechService.isRecording ? .red : .primary)
                        .font(.title2)
                }
                .disabled(!speechService.isAuthorized)

                Button("送信") {
                    guard !inputText.isEmpty, !isOverLimit else { return }
                    onSubmit(inputText)
                    inputText = ""
                }
                .buttonStyle(.borderedProminent)
                .disabled(inputText.isEmpty || isOverLimit)
            }

            Text("\(inputText.count) / \(maxCharacters)")
                .font(.caption2)
                .foregroundStyle(isOverLimit ? .red : .secondary)
        }
        .padding()
        .alert("録音エラー", isPresented: Binding(
            get: { recordingError != nil },
            set: { if !$0 { recordingError = nil } }
        )) {
            Button("OK") { recordingError = nil }
        } message: {
            Text(recordingError ?? "")
        }
        .onChange(of: speechService.recognizedText) { _, newValue in
            if !newValue.isEmpty {
                inputText = newValue
            }
        }
    }

    private func toggleRecording() {
        if speechService.isRecording {
            speechService.stopRecording()
        } else {
            do {
                speechService.recognizedText = ""
                try speechService.startRecording()
            } catch {
                recordingError = "音声認識を開始できませんでした"
            }
        }
    }
}

#Preview {
    VoiceInputView(speechService: SpeechService()) { text in
        print(text)
    }
}
