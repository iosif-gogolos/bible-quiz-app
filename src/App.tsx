import type { MouseEvent } from 'react';
import { useState, useEffect } from 'react';

import {
  Container, Card, CardContent, Typography,
  Button, RadioGroup, FormControlLabel, Radio, Box, LinearProgress,
  FormControl, FormLabel, Select, MenuItem, CircularProgress,
  IconButton, Menu, Avatar
} from '@mui/material';
import type { QuizSettings, Language, Difficulty, Question } from './types';

// UI Dictionary for interface labels
const uiTranslations = {
  el: {
    title: 'Βιβλικο Κουιζ',
    difficultyLabel: 'Βαθμός δυσκολίας',
    easy: 'Εύκολο (π.χ. για Κυριακό)',
    medium: 'Μέτριο (π.χ. για Εφοιβικό)',
    hard: 'Δύσκολο (π.χ. για Νεολαία και Μεγάλους)',
    start: 'Έναρξη',
    question: 'Ερώτηση',
    of: 'από',
    finish: 'Ολοκλήρωση',
    next: 'Επόμενη Ερώτηση',
    completed: 'Ολοκληρώθηκε!',
    score: 'Το σκορ σου:',
    restart: 'Πίσω στην αρχική σελίδα'
  },
  en: {
    title: 'Bible Quiz',
    difficultyLabel: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    start: 'Start',
    question: 'Question',
    of: 'of',
    finish: 'Finish Quiz',
    next: 'Next Question',
    completed: 'Quiz Completed!',
    score: 'Your Score:',
    restart: 'Back to home screen'
  },
  de: {
    title: 'Bibel-Quiz',
    difficultyLabel: 'Schwierigkeit',
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Schwer',
    start: 'Starten',
    question: 'Frage',
    of: 'von',
    finish: 'Quiz Beenden',
    next: 'Nächste Frage',
    completed: 'Quiz Beendet!',
    score: 'Dein Ergebnis:',
    restart: 'Zurück zum Startbildschirm'
  }
};

export default function App() {
  const [appState, setAppState] = useState<'setup' | 'loading' | 'quiz' | 'finished'>('setup');

  const [settings, setSettings] = useState<QuizSettings>({
    language: 'el',
    difficulty: 'easy'
  });

  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Background Image Effect
  useEffect(() => {
    if (appState === 'quiz') {
      document.body.style.backgroundImage = 'url("/background-quiz.png")';
    } else {
      document.body.style.backgroundImage = 'url("/bg-launch-screen.png")';
    }

    return () => {
      document.body.style.backgroundImage = 'url("/bg-launch-screen.png")';
    };
  }, [appState]);

  // Language Dropdown Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectLanguage = (lang: Language) => {
    setSettings(prev => ({ ...prev, language: lang }));
    handleCloseMenu();
  };

  const handleStartQuiz = async () => {
    setAppState('loading');
    setError(null);

    try {
      const response = await fetch(`/questions/${settings.language}.json`);
      if (!response.ok) {
        throw new Error('Failed to load questions.');
      }

      const allQuestions: Question[] = await response.json();
      const filtered = allQuestions.filter((q: Question) => q.difficulty === settings.difficulty);
      const questionsToUse = filtered.length > 0 ? filtered : allQuestions;

      setActiveQuestions(questionsToUse);
      setCurrentStep(0);
      setScore(0);
      setSelectedOption(null);
      setAppState('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAppState('setup');
    }
  };

  const handleNext = () => {
    const currentQuestion = activeQuestions[currentStep];
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }

    if (currentStep + 1 < activeQuestions.length) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setAppState('finished');
    }
  };

  const handleRestart = () => {
    setAppState('setup');
  };

  const currentQuestion = activeQuestions[currentStep];
  const t = uiTranslations[settings.language];

  return (
      <Container maxWidth="sm" sx={{ mt: 4, position: 'relative' }}>

        {/* UPPER-RIGHT LANGUAGE SELECTOR ICON BUTTON */}
        <Box sx={{ position: 'absolute', top: -16, right: 16, zIndex: 10 }}>
          <IconButton
              onClick={handleOpenMenu}
              sx={{
                p: 0.5,
                bgcolor: '#FFE600',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '&:hover': { bgcolor: '#F0D800' }
              }}
          >
            <Avatar
                src={`/${settings.language}.png`}
                alt={settings.language}
                sx={{ width: 36, height: 36 }}
            />
          </IconButton>

          <Menu
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleCloseMenu}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: '20px',
                    bgcolor: '#FFE600',
                    mt: 1,
                    px: 0.5,
                  },
                },
              }}
          >
            <MenuItem onClick={() => handleSelectLanguage('en')}>
              <Avatar src="/en.png" alt="English" sx={{ width: 32, height: 32, mr: 1 }} /> English
            </MenuItem>
            <MenuItem onClick={() => handleSelectLanguage('el')}>
              <Avatar src="/el.png" alt="Greek" sx={{ width: 32, height: 32, mr: 1 }} /> Ελληνικά
            </MenuItem>
            <MenuItem onClick={() => handleSelectLanguage('de')}>
              <Avatar src="/de.png" alt="German" sx={{ width: 32, height: 32, mr: 1 }} /> Deutsch
            </MenuItem>
          </Menu>
        </Box>

        <Card elevation={4} sx={{ borderRadius: '16px', mt: 3 }}>
          <CardContent sx={{ p: 4 }}>

            {/* 1. SETUP SCREEN */}
            {appState === 'setup' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                  <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {t.title}
                  </Typography>

                  {error && (
                      <Typography color="error" align="center">
                        {error}
                      </Typography>
                  )}

                  <FormControl fullWidth>
                    <FormLabel sx={{ mb: 1 }}>{t.difficultyLabel}</FormLabel>
                    <Select
                        value={settings.difficulty}
                        onChange={(e) => setSettings({ ...settings, difficulty: e.target.value as Difficulty })}
                    >
                      <MenuItem value="easy">{t.easy}</MenuItem>
                      <MenuItem value="medium">{t.medium}</MenuItem>
                      <MenuItem value="hard">{t.hard}</MenuItem>
                    </Select>
                  </FormControl>

                  <Button variant="contained" size="large" fullWidth onClick={handleStartQuiz} sx={{ mt: 2 }}>
                    {t.start}
                  </Button>
                </Box>
            )}

            {/* 2. LOADING SCREEN */}
            {appState === 'loading' && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
            )}

            {/* 3. QUIZ SCREEN */}
            {appState === 'quiz' && currentQuestion && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t.question} {currentStep + 1} {t.of} {activeQuestions.length}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={((currentStep + 1) / activeQuestions.length) * 100}
                        sx={{ mt: 1, height: 8, borderRadius: 2 }}
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    {currentQuestion.question}
                  </Typography>

                  <RadioGroup
                      value={selectedOption ?? ''}
                      onChange={(e) => setSelectedOption(Number(e.target.value))}
                  >
                    {currentQuestion.options.map((option, index) => (
                        <FormControlLabel
                            key={index}
                            value={index}
                            control={<Radio />}
                            label={option}
                        />
                    ))}
                  </RadioGroup>

                  <Button
                      variant="contained"
                      fullWidth
                      disabled={selectedOption === null}
                      onClick={handleNext}
                      sx={{ mt: 3 }}
                  >
                    {currentStep === activeQuestions.length - 1 ? t.finish : t.next}
                  </Button>
                </>
            )}

            {/* 4. FINISHED SCREEN */}
            {appState === 'finished' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {t.completed}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                    {t.score} {score} / {activeQuestions.length}
                  </Typography>
                  <Button variant="contained" onClick={handleRestart}>
                    {t.restart}
                  </Button>
                </Box>
            )}

          </CardContent>
        </Card>
      </Container>
  );
}