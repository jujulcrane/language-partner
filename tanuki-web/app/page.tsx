import React from 'react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="tanuki-gradient text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center animate-fadeIn">
          <div className="text-8xl mb-6">🦝</div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Talking Tanuki
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            AI-Powered Japanese Language Learning
          </p>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Your personal Japanese conversation partner. Practice speaking, get instant feedback,
            and improve naturally through AI-powered conversations.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            Learn Japanese Through Natural Conversation
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <FeatureCard
              icon="🎤"
              title="Voice Conversation"
              description="Practice speaking with native-quality speech recognition and text-to-speech"
            />
            <FeatureCard
              icon="📝"
              title="Real-time Feedback"
              description="Get instant grammar corrections and suggestions as you practice"
            />
            <FeatureCard
              icon="🎯"
              title="JLPT Levels"
              description="Adaptive responses tailored to your level (N5-N1)"
            />
            <FeatureCard
              icon="📚"
              title="Grammar Practice"
              description="Target specific grammar patterns you want to master"
            />
            <FeatureCard
              icon="📱"
              title="Cross-Platform"
              description="Available on iOS and Android devices"
            />
            <FeatureCard
              icon="🔒"
              title="Private & Secure"
              description="Your conversations are encrypted and private"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            How It Works
          </h2>

          <div className="space-y-12">
            <StepCard
              number="1"
              title="Choose Your Level"
              description="Select your JLPT level and grammar points you want to practice"
            />
            <StepCard
              number="2"
              title="Start Conversing"
              description="Speak or type in Japanese - your AI partner responds naturally"
            />
            <StepCard
              number="3"
              title="Get Feedback"
              description="Receive instant grammar feedback and suggestions to improve"
            />
            <StepCard
              number="4"
              title="Track Progress"
              description="Review your conversation history and see your improvement"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 px-4 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Coming Soon to App Stores
          </h2>
          <p className="text-xl mb-8 text-white/90">
            iOS and Android apps launching soon. Sign up for early access and be the first to know!
          </p>
          <button className="bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
            Join Waitlist
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-4xl mb-4">🦝</div>
          <h3 className="text-2xl font-bold mb-4">Talking Tanuki</h3>
          <p className="text-gray-400 mb-6">
            AI-powered Japanese language learning
          </p>
          <div className="flex justify-center space-x-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-gray-500 text-sm mt-8">
            © 2025 Talking Tanuki. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow animate-slideUp">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

// Step Card Component
function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start space-x-6">
      <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
        {number}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600 text-lg">{description}</p>
      </div>
    </div>
  )
}
