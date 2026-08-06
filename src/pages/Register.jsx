import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CITIES } from '../lib/constants'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState(CITIES[0])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error, needsEmailConfirmation } = await signUp({ email, password, name, city })
    setSubmitting(false)
    if (error) {
      setError(error.message ?? 'Не удалось зарегистрироваться')
      return
    }
    if (needsEmailConfirmation) {
      setNeedsEmailConfirmation(true)
      return
    }
    navigate('/')
  }

  if (needsEmailConfirmation) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Проверьте почту</h1>
        <p className="text-gray-500">
          Мы отправили письмо на {email}. Перейдите по ссылке в письме, чтобы подтвердить
          аккаунт, затем войдите.
        </p>
        <Link to="/login" className="text-sea-dark hover:underline mt-4 inline-block">
          Перейти ко входу
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Регистрация</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
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
          minLength={6}
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-sea text-white py-2 font-medium hover:bg-sea-dark disabled:opacity-50"
        >
          {submitting ? 'Регистрация…' : 'Зарегистрироваться'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-sea-dark hover:underline">
          Войти
        </Link>
      </p>
    </div>
  )
}
