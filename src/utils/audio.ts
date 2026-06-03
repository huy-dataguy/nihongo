/**
 * Audio text-to-speech helper for Japanese N5 Learning
 */

export function speakJapanese(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported on this browser.");
    return;
  }

  try {
    // Cancel any ongoing speaking immediately
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.8; // speed: 0.8 is comfortable for learners
    utterance.pitch = 1.0;

    // Find a proper Japanese voice if available, otherwise browser will use defaults
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(voice => voice.lang === "ja-JP" || voice.lang.startsWith("ja"));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Speech synthesis failed", error);
  }
}
