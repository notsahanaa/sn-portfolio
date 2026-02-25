import './App.css'

function App() {
  const text = "Coming Soon :)"

  return (
    <div className="container">
      <h1 className="wave-text">
        {text.split('').map((letter, index) => (
          <span
            key={index}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h1>
    </div>
  )
}

export default App
