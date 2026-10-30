import React, { useState, useEffect } from 'react'
import { useGoogleLogin, googleLogout } from '@react-oauth/google'
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  BookOpen, 
  Layers, 
  LayoutDashboard, 
  Library, 
  BarChart3, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  Brain,
  ChevronRight,
  LogOut,
  Play,
  Check,
  X,
  Trash2,
  Plus
} from 'lucide-react'

export default function App() {
  // Google User State
  const [user, setUser] = useState(null)

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard')

  // Decks & Flashcards State (Starts empty/dynamic without static inputs)
  const [decks, setDecks] = useState([])
  const [selectedDeckId, setSelectedDeckId] = useState(null)
  
  // PDF Upload State
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Interactive 3D Card Flip State
  const [flippedCards, setFlippedCards] = useState({})

  // Quiz Mode State
  const [quizActive, setQuizActive] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  // Analytics Stats State
  const [quizzesTaken, setQuizzesTaken] = useState(0)
  const [sessionSeconds, setSessionSeconds] = useState(0)

  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Google Custom Login Handler via useGoogleLogin Hook
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const profile = await res.json()
        setUser({
          name: profile.name,
          email: profile.email,
          picture: profile.picture
        })
      } catch (err) {
        console.error('Failed to fetch user profile from Google:', err)
      }
    },
    onError: (error) => console.log('Login Failed:', error)
  })

  const handleLogout = () => {
    googleLogout()
    setUser(null)
  }

  // Active Deck Calculation
  const activeDeck = decks.find(d => d.id === selectedDeckId) || decks[0]
  const currentCards = activeDeck ? activeDeck.cards : []

  // Dynamic Calculated Analytics
  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0)
  const totalMastered = decks.reduce((acc, d) => acc + d.cards.filter(c => c.mastered).length, 0)
  const overallMastery = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0

  const formatStudyTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
  }

  // PDF Upload Handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:5000/api/generate-flashcards', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (data.flashcards && Array.isArray(data.flashcards)) {
        const newDeckId = Date.now()
        const newDeckName = file.name.replace('.pdf', '')

        const newCards = data.flashcards.map((c, idx) => ({
          id: `${newDeckId}-${idx}`,
          question: c.question,
          answer: c.answer,
          mastered: false // Mastery starts strictly unverified until quiz execution
        }))

        const newDeck = {
          id: newDeckId,
          title: newDeckName,
          cards: newCards,
          createdAt: new Date().toLocaleDateString()
        }

        setDecks(prev => [...prev, newDeck])
        setSelectedDeckId(newDeckId)
        setFile(null)
      }
    } catch (err) {
      console.error(err)
      alert('Could not connect to backend server.')
    } finally {
      setLoading(false)
    }
  }

  // Quiz Handling
  const startQuiz = () => {
    if (!currentCards || currentCards.length === 0) return
    setQuizActive(true)
    setQuizIndex(0)
    setQuizScore(0)
    setQuizCompleted(false)
  }

  const handleQuizAnswer = (isCorrect) => {
    const currentCard = currentCards[quizIndex]

    if (isCorrect) {
      setQuizScore(prev => prev + 1)
      // Automatically update card mastery on correct quiz response
      setDecks(prevDecks => prevDecks.map(deck => {
        if (deck.id === activeDeck.id) {
          return {
            ...deck,
            cards: deck.cards.map(card => 
              card.id === currentCard.id ? { ...card, mastered: true } : card
            )
          }
        }
        return deck
      }))
    }

    if (quizIndex + 1 < currentCards.length) {
      setQuizIndex(prev => prev + 1)
    } else {
      setQuizCompleted(true)
      setQuizzesTaken(prev => prev + 1)
    }
  }

  const deleteDeck = (deckId) => {
    setDecks(prev => prev.filter(d => d.id !== deckId))
    if (selectedDeckId === deckId) {
      setSelectedDeckId(null)
    }
  }

  // Google Authentication Screen Barrier
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-6">
        <div className="glass-panel p-10 rounded-3xl border border-slate-800 text-center max-w-md w-full space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/25 w-16 h-16 mx-auto flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Smart Study Companion</h1>
            <p className="text-slate-400 text-sm mt-1">Sign in with your Google Account to access your study decks & AI flashcards.</p>
          </div>
          <div className="pt-4">
            <button
              onClick={() => login()}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3 border border-indigo-400/30 cursor-pointer"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex font-sans antialiased">
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0d1322] flex flex-col justify-between p-5 hidden md:flex shrink-0">
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-8">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide leading-none">Smart Study</h1>
              <span className="text-xs text-indigo-400 font-medium tracking-wider uppercase">Companion AI</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button 
              onClick={() => { setActiveTab('dashboard'); setQuizActive(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab('decks'); setQuizActive(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'decks' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Library className="w-4 h-4" /> Student Decks ({decks.length})
            </button>
            <button 
              onClick={() => { setActiveTab('analytics'); setQuizActive(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
          </nav>
        </div>

        {/* Logged in User Section */}
        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 to-slate-900/50">
          <div className="flex items-center gap-3 mb-3">
            <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full border border-indigo-400" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full py-2 px-3 bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-800/80 bg-[#0d1322]/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Workspace</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-200 font-semibold capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Google Auth Connected
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* STATS OVERVIEW HEADER */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Brain className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Flashcards</p>
                <h3 className="text-xl font-bold text-white mt-0.5">{totalCards} Cards</h3>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400"><Layers className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Student Decks</p>
                <h3 className="text-xl font-bold text-white mt-0.5">{decks.length} Decks</h3>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><CheckCircle2 className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Verified Mastery</p>
                <h3 className="text-xl font-bold text-white mt-0.5">{overallMastery}%</h3>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Study Timer</p>
                <h3 className="text-xl font-bold text-white mt-0.5">{formatStudyTime(sessionSeconds)}</h3>
              </div>
            </div>
          </div>

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* PDF Upload Form */}
              <section className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-[#0d1322]">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">Upload Material</h2>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Upload PDF study guides to generate flashcards inside your student decks.
                </p>

                <form onSubmit={handleUpload}>
                  <label className="group relative flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-indigo-950/10 transition-all p-6 text-center">
                    <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium mb-1">
                      <span className="text-indigo-400 underline decoration-indigo-500/50 underline-offset-4">Click to select PDF</span>
                    </p>
                    <p className="text-[11px] text-slate-500">PDF up to 10MB</p>

                    {file && (
                      <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30 text-xs text-indigo-200">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="truncate max-w-[180px]">{file.name}</span>
                      </div>
                    )}
                    <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                  </label>

                  <button
                    type="submit"
                    disabled={!file || loading}
                    className="mt-6 w-full py-3.5 px-6 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'Processing Document...' : 'Generate Student Deck'}
                  </button>
                </form>
              </section>

              {/* Flashcards Deck & Quiz Launcher */}
              <section className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/40 to-[#0d1322]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-400" /> 
                      {activeDeck ? activeDeck.title : 'No Deck Selected'} ({currentCards.length} Cards)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Click card to flip. Launch Quiz Mode to verify mastery.</p>
                  </div>

                  {currentCards.length > 0 && !quizActive && (
                    <button 
                      onClick={startQuiz}
                      className="flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Quiz Mode
                    </button>
                  )}
                </div>

                {/* Quiz Mode View */}
                {quizActive ? (
                  <div className="bg-slate-950/60 p-8 rounded-2xl border border-indigo-500/30 text-center space-y-6">
                    {!quizCompleted ? (
                      <>
                        <div className="flex justify-between items-center text-xs text-indigo-400 font-bold uppercase">
                          <span>Question {quizIndex + 1} of {currentCards.length}</span>
                          <span>Score: {quizScore}</span>
                        </div>
                        <p className="text-base font-semibold text-white py-6">
                          {currentCards[quizIndex].question}
                        </p>
                        <div className="p-4 bg-slate-900 rounded-xl text-sm text-slate-300 border border-slate-800">
                          <strong>Answer:</strong> {currentCards[quizIndex].answer}
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                          <button 
                            onClick={() => handleQuizAnswer(false)} 
                            className="flex-1 py-3 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/60 text-rose-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <X className="w-4 h-4" /> Need Review
                          </button>
                          <button 
                            onClick={() => handleQuizAnswer(true)} 
                            className="flex-1 py-3 bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/60 text-emerald-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4" /> Correct (Mastered)
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                        <h3 className="text-xl font-bold text-white">Quiz Completed!</h3>
                        <p className="text-sm text-slate-300">You scored {quizScore} / {currentCards.length}. Mastered cards have been updated in your stats.</p>
                        <button 
                          onClick={() => setQuizActive(false)} 
                          className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs cursor-pointer"
                        >
                          Return to Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard 3D Card Grid */
                  currentCards.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      <Brain className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                      <p className="text-sm font-medium">No study cards available in this deck.</p>
                      <p className="text-xs mt-1">Upload a PDF on the left to populate your student deck.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentCards.map((card, idx) => {
                        const isFlipped = !!flippedCards[idx]
                        return (
                          <div 
                            key={card.id} 
                            onClick={() => setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }))} 
                            className="h-52 perspective-1000 cursor-pointer select-none"
                          >
                            <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                              {/* FRONT */}
                              <div className={`absolute inset-0 w-full h-full glass-card p-5 rounded-2xl flex flex-col justify-between backface-hidden border ${card.mastered ? 'border-emerald-500/50' : 'border-slate-700/50'}`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                    card.mastered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  }`}>
                                    {card.mastered ? 'Mastered via Quiz' : `Card ${idx + 1}`}
                                  </span>
                                  <RotateCw className="w-4 h-4 text-slate-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-200 my-auto">{card.question}</p>
                                <span className="text-[11px] text-slate-500">Click to reveal answer</span>
                              </div>

                              {/* BACK */}
                              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-950/90 to-slate-900/90 p-5 rounded-2xl flex flex-col justify-between backface-hidden rotate-y-180 border border-indigo-500/50">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Answer</span>
                                <p className="text-xs text-slate-100 my-auto">{card.answer}</p>
                                <span className="text-[11px] text-indigo-300/60">Take quiz to mark as mastered</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </section>
            </div>
          )}

          {/* STUDENT DECKS TAB */}
          {activeTab === 'decks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Library className="w-6 h-6 text-indigo-400" /> Student Decks Library
                </h2>
              </div>

              {decks.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800">
                  <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">No Decks Found</h3>
                  <p className="text-sm text-slate-400 mt-1">Upload a PDF document from the Dashboard tab to create your first deck.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {decks.map(deck => (
                    <div 
                      key={deck.id} 
                      className={`glass-panel p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedDeckId === deck.id ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => { setSelectedDeckId(deck.id); setActiveTab('dashboard'); }}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }} 
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h3 className="text-base font-bold text-white mb-1 truncate">{deck.title}</h3>
                        <p className="text-xs text-slate-400">{deck.cards.length} Flashcards • Created {deck.createdAt}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                        <span>Select Deck</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-400" /> Performance & Study Analytics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Quizzes Completed</p>
                  <h3 className="text-3xl font-extrabold text-white mt-2">{quizzesTaken}</h3>
                  <p className="text-xs text-indigo-400 mt-2">Active quiz practice runs</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Cards Mastered</p>
                  <h3 className="text-3xl font-extrabold text-white mt-2">{totalMastered} / {totalCards}</h3>
                  <p className="text-xs text-emerald-400 mt-2">{overallMastery}% verified mastery rate</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Total Active Study Time</p>
                  <h3 className="text-3xl font-extrabold text-white mt-2">{formatStudyTime(sessionSeconds)}</h3>
                  <p className="text-xs text-amber-400 mt-2">Continuous session timer</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}