import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle, Award, Clock, Target } from 'lucide-react';
import { useLabContext } from '../../contexts/LabContext';
import { generateRSAKeyPair, rsaEncrypt, rsaDecrypt } from '../../utils/rsa';
import { gcdWithSteps } from '../../utils/numberTheory';
import BigInteger from 'big-integer';

interface Question {
  id: string;
  type: 'mcq' | 'calculation' | 'practical';
  title: string;
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const questions: Question[] = [
  {
    id: 'rsa-basics-1',
    type: 'mcq',
    title: 'RSA Public Exponent',
    question: 'Why is 65537 commonly chosen as the public exponent e in RSA?',
    options: [
      'It is the largest prime number',
      'It is a Fermat prime (2^16 + 1), making encryption efficient',
      'It is the smallest odd number',
      'It provides the highest security'
    ],
    correctAnswer: 1,
    explanation: '65537 = 2^16 + 1 is a Fermat prime. It has only two 1-bits in binary (10000000000000001), making modular exponentiation very efficient while still being large enough to be secure.',
    points: 10,
    difficulty: 'easy'
  },
  {
    id: 'rsa-basics-2',
    type: 'calculation',
    title: 'GCD Calculation',
    question: 'Calculate gcd(56, 98) using the Euclidean algorithm.',
    correctAnswer: 14,
    explanation: 'Using the Euclidean algorithm: 98 = 56×1 + 42, 56 = 42×1 + 14, 42 = 14×3 + 0. Therefore gcd(56, 98) = 14.',
    points: 15,
    difficulty: 'medium'
  },
  {
    id: 'rsa-security-1',
    type: 'mcq',
    title: 'RSA Key Size Security',
    question: 'What is the minimum recommended RSA key size for current security standards?',
    options: [
      '512 bits',
      '1024 bits',
      '2048 bits',
      '4096 bits'
    ],
    correctAnswer: 2,
    explanation: '2048 bits is the current minimum recommended key size. 512 and 1024-bit keys are considered insecure and can be factored with modern computing power.',
    points: 10,
    difficulty: 'easy'
  },
  {
    id: 'rsa-math-1',
    type: 'calculation',
    title: 'Modular Arithmetic',
    question: 'Calculate 7^3 mod 13',
    correctAnswer: 5,
    explanation: '7^3 = 343. 343 ÷ 13 = 26 remainder 5. Therefore 7^3 mod 13 = 5.',
    points: 15,
    difficulty: 'medium'
  },
  {
    id: 'rsa-practical-1',
    type: 'practical',
    title: 'Key Generation Challenge',
    question: 'Generate a 1024-bit RSA key pair and encrypt the message "Hello RSA!"',
    explanation: 'This exercise tests your ability to generate RSA keys and perform encryption. Make sure to use the generated public key for encryption.',
    points: 25,
    difficulty: 'hard'
  }
];

export function Exercises() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>('');
  const [calculationAnswer, setCalculationAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [practicalKeyPair, setPracticalKeyPair] = useState<any>(null);
  const [practicalMessage, setPracticalMessage] = useState('Hello RSA!');
  const [practicalCiphertext, setPracticalCiphertext] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  const { state, completeExercise, addBadge } = useLabContext();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const question = questions[currentQuestion];

  const handleSubmitAnswer = () => {
    let correct = false;
    let userAnswer: string | number = '';

    if (question.type === 'mcq') {
      userAnswer = selectedAnswer;
      correct = selectedAnswer === question.correctAnswer;
    } else if (question.type === 'calculation') {
      userAnswer = calculationAnswer;
      correct = parseInt(calculationAnswer) === question.correctAnswer;
    } else if (question.type === 'practical') {
      // For practical exercises, check if key pair is generated and message is encrypted
      correct = practicalKeyPair && practicalCiphertext;
      userAnswer = 'practical_completed';
    }

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(prev => prev + question.points);
      setCompletedQuestions(prev => new Set([...prev, question.id]));
      completeExercise(question.id, question.points);

      // Award badges based on progress
      if (completedQuestions.size + 1 >= 3) {
        addBadge({
          id: 'math-wizard',
          name: 'Math Wizard',
          description: 'Complete all number theory exercises',
          icon: '🧙‍♂️',
          earned: true
        });
      }
    }
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer('');
    setCalculationAnswer('');
    setPracticalKeyPair(null);
    setPracticalCiphertext('');
    setCurrentQuestion(prev => (prev + 1) % questions.length);
    setStartTime(Date.now());
  };

  const handleGeneratePracticalKey = () => {
    const result = generateRSAKeyPair(1024);
    setPracticalKeyPair(result.keyPair);
  };

  const handlePracticalEncrypt = () => {
    if (practicalKeyPair && practicalMessage) {
      try {
        const encrypted = rsaEncrypt(practicalMessage, practicalKeyPair.publicKey);
        setPracticalCiphertext(encrypted);
      } catch (error) {
        console.error('Encryption failed:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="text-blue-600" size={32} />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Interactive Exercises</h2>
              <p className="text-gray-600">Test your RSA knowledge with hands-on challenges</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>{formatTime(timeSpent)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Award size={16} />
              <span>{score} points</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{completedQuestions.size}/{questions.length} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedQuestions.size / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="flex space-x-2 mb-8 overflow-x-auto">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => {
                if (!showResult) {
                  setCurrentQuestion(index);
                  setShowResult(false);
                  setSelectedAnswer('');
                  setCalculationAnswer('');
                  setStartTime(Date.now());
                }
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                index === currentQuestion
                  ? 'bg-blue-600 text-white'
                  : completedQuestions.has(q.id)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={showResult}
            >
              {index + 1}
              {completedQuestions.has(q.id) && (
                <CheckCircle size={14} className="ml-1 inline" />
              )}
            </button>
          ))}
        </div>

        {/* Current Question */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                {question.difficulty.toUpperCase()}
              </span>
              <span className="text-sm text-gray-600">{question.points} points</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">{question.title}</h3>
          <p className="text-gray-700 mb-6">{question.question}</p>

          {/* Question Type Specific Content */}
          {question.type === 'mcq' && (
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={selectedAnswer === index}
                    onChange={(e) => setSelectedAnswer(parseInt(e.target.value))}
                    className="text-blue-600 focus:ring-blue-500"
                    disabled={showResult}
                  />
                  <span className={`${showResult && index === question.correctAnswer ? 'text-green-600 font-medium' : ''}`}>
                    {option}
                  </span>
                  {showResult && index === question.correctAnswer && (
                    <CheckCircle size={16} className="text-green-600" />
                  )}
                  {showResult && selectedAnswer === index && index !== question.correctAnswer && (
                    <XCircle size={16} className="text-red-600" />
                  )}
                </label>
              ))}
            </div>
          )}

          {question.type === 'calculation' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <input
                  type="number"
                  value={calculationAnswer}
                  onChange={(e) => setCalculationAnswer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your numerical answer..."
                  disabled={showResult}
                />
              </div>
              {showResult && (
                <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <p className="font-medium">
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className="text-sm">
                    The correct answer is: {question.correctAnswer}
                  </p>
                </div>
              )}
            </div>
          )}

          {question.type === 'practical' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Step 1: Generate RSA Key Pair</h4>
                  <button
                    onClick={handleGeneratePracticalKey}
                    disabled={showResult}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Generate 1024-bit Key Pair
                  </button>
                  {practicalKeyPair && (
                    <div className="bg-green-100 border border-green-300 rounded p-3">
                      <p className="text-green-800 text-sm">✓ Key pair generated successfully!</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Step 2: Encrypt Message</h4>
                  <input
                    type="text"
                    value={practicalMessage}
                    onChange={(e) => setPracticalMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={showResult}
                  />
                  <button
                    onClick={handlePracticalEncrypt}
                    disabled={!practicalKeyPair || showResult}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Encrypt Message
                  </button>
                  {practicalCiphertext && (
                    <div className="bg-green-100 border border-green-300 rounded p-3">
                      <p className="text-green-800 text-sm">✓ Message encrypted successfully!</p>
                      <p className="text-xs text-green-700 font-mono mt-1 break-all">
                        {practicalCiphertext.slice(0, 50)}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!showResult && (
            <div className="mt-6">
              <motion.button
                onClick={handleSubmitAnswer}
                disabled={
                  (question.type === 'mcq' && selectedAnswer === '') ||
                  (question.type === 'calculation' && !calculationAnswer) ||
                  (question.type === 'practical' && (!practicalKeyPair || !practicalCiphertext))
                }
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Submit Answer
              </motion.button>
            </div>
          )}

          {/* Result and Explanation */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <div className={`p-4 rounded-lg border ${
                  isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <XCircle className="text-red-600" size={20} />
                    )}
                    <span className={`font-medium ${
                      isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {isCorrect ? `Correct! +${question.points} points` : 'Incorrect'}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {question.explanation}
                  </p>
                </div>

                <div className="mt-4 flex justify-between">
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    {currentQuestion < questions.length - 1 ? 'Next Question' : 'Start Over'}
                  </button>
                  
                  {completedQuestions.size === questions.length && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Award size={20} />
                      <span className="font-medium">All exercises completed!</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}