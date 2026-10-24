import './MicIntro.css'

const EXAMPLES = ['need to go shopping today', 'add milk to shopping', 'gift idea: photo book']

/** First-time screen: what Notey does, with examples that fill the text box. */
export function MicIntro({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mic-intro">
      <div className="mic-intro-art" aria-hidden="true">
        <span className="tone-coral" />
        <span className="tone-blue" />
        <span className="tone-green" />
      </div>
      <h1>What’s on your mind?</h1>
      <p>Talk or type freely. I’ll file each thing in Today, Calendar, Notes or Lists.</p>
      <div className="mic-intro-examples">
        {EXAMPLES.map((example) => (
          <button key={example} className="clay-sm" onClick={() => onPick(example)}>
            “{example}”
          </button>
        ))}
      </div>
    </div>
  )
}
