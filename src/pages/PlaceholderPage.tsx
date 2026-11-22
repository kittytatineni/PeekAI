
type PlaceholderPageProps = {
  page: string
  onBack: () => void
}

function PlaceholderPage({ page, onBack }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <div className="eyebrow">PEEKAI WORKSPACE</div>
      <h1>{page}</h1>
      <p>
        Your personalised {page.toLowerCase()} experience is coming soon.
      </p>

      <div className="coming-soon">
        We're building this part of PeekAI next.
      </div>

      <button onClick={onBack}>
        Back to dashboard
      </button>
    </div>
  )
}

export default PlaceholderPage
