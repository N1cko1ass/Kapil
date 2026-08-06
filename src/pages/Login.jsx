import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn({ email, password })
    setSubmitting(false)
    if (error) {
      setError('Неверный email или пароль')
      return
    }
    navigate('/')
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Вход</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        <input
          type="password"
          required
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-sea text-white py-2 font-medium hover:bg-sea-dark disabled:opacity-50"
        >
          {submitting ? 'Вход…' : 'Войти'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-sea-dark hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
