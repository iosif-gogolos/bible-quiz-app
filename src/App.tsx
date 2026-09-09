import type { MouseEvent } from 'react';
import { useState, useEffect } from 'react';

import {
  Container, Card, CardContent, Typography,
  Button, RadioGroup, FormControlLabel, Radio, Box, LinearProgress,
  FormControl, FormLabel, Select, MenuItem, CircularProgress,
  IconButton, Menu, Avatar, TextField, ToggleButton, ToggleButtonGroup, Paper
} from '@mui/material';
import type { QuizSettings, Language, Difficulty, Question } from './types';
import { supabase } from './supabaseClient';

// Helper function to generate 4-character random code/password
const generate4CharKey = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like O, 0, I, 1
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const uiTranslations = {
  el: {
    title: 'Βιβλικο Κουιζ',
    difficultyLabel: 'Βαθμός δυσκολίας',
    easy: 'Εύκολο (π.χ. για Κυριακό)',
    medium: 'Μέτριο (π.χ. για Εφοιβικό)',
    hard: 'Δύσκολο (π.χ. για Νεολαία και Μεγάλους)',
    start: 'Έναρξη',
    createRoom: 'Δημιουργία Δωματίου',
    joinRoom: 'Σύνδεση σε Δωμάτιο',
    soloMode: 'Μονός Παίκτης',
    multiMode: 'Πολλαπλοί Παίκτες',
    roomCode: 'Κωδικός Δωματίου',
    password: 'PIN / Password',
    maxPlayers: 'Μέγιστος Αριθμός Παικτών',
    enterName: 'Το όνομά σου',
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
    start: 'Start Solo',
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    soloMode: 'Single Player',
    multiMode: 'Multiplayer',
    roomCode: 'Room Code',
    password: 'PIN / Password',
    maxPlayers: 'Max Players',
    enterName: 'Your Nickname',
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
    start: 'Einzelspieler Starten',
    createRoom: 'Raum Erstellen',
    joinRoom: 'Raum Beitreten',
    soloMode: 'Einzelspieler',
    multiMode: 'Mehrspieler',
    roomCode: 'Raum-Code',
    password: 'PIN / Passwort',
    maxPlayers: 'Max. Spieler',
    enterName: 'Dein Name',
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
  const [appState, setAppState] = useState<'setup' | 'lobby' | 'loading' | 'quiz' | 'finished'>('setup');
  const [playMode, setPlayMode] = useState<'solo' | 'multiplayer'>('solo');
  const [multiAction, setMultiAction] = useState<'create' | 'join'>('create');

  const [settings, setSettings] = useState<QuizSettings>({
    language: 'el',
    difficulty: 'easy'
  });

  // Multiplayer States
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [activeRoom, setActiveRoom] = useState<{ id: string; code: string; pass: string } | null>(null);

  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.backgroundImage = appState === 'quiz'
        ? 'url("/background-quiz.png")'
        : 'url("/bg-launch-screen.png")';
  }, [appState]);

  // Language Dropdown Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleSelectLanguage = (lang: Language) => {
    setSettings(prev => ({ ...prev, language: lang }));
    handleCloseMenu();
  };

  // Create Multiplayer Session in Supabase
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    setAppState('loading');
    setError(null);

    const generatedCode = generate4CharKey();
    const generatedPass = generate4CharKey();

    try {
      const { data, error: dbError } = await supabase
          .from('room')
          .insert([
            {
              room_code: generatedCode,
              password: generatedPass,
              max_players: maxPlayers,
              language: settings.language,
              difficulty: settings.difficulty,
              status: 'waiting'
            }
          ])
          .select()
          .single();

      if (dbError) throw dbError;

      setActiveRoom({
        id: data.id,
        code: generatedCode,
        pass: generatedPass
      });
      setAppState('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room.');
      setAppState('setup');
    }
  };

  // Join Existing Room in Supabase
  const handleJoinRoom = async () => {
    if (!playerName.trim() || !inputRoomCode.trim() || !inputPassword.trim()) {
      setError('Please enter your name, room code, and password.');
      return;
    }

    setAppState('loading');
    setError(null);

    try {
      const { data, error: dbError } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_code', inputRoomCode.trim().toUpperCase())
          .eq('password', inputPassword.trim().toUpperCase())
          .single();

      if (dbError || !data) {
        throw new Error('Invalid room code or password.');
      }

      setActiveRoom({
        id: data.id,
        code: data.room_code,
        pass: data.password
      });
      setAppState('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join room.');
      setAppState('setup');
    }
  };

  // Start Solo Quiz
  const handleStartSoloQuiz = async () => {
    setAppState('loading');
    setError(null);

    try {
      const response = await fetch(`/questions/${settings.language}.json`);
      if (!response.ok) throw new Error('Failed to load questions.');

      const allQuestions: Question[] = await response.json();
      const filtered = allQuestions.filter((q: Question) => q.difficulty === settings.difficulty);

      setActiveQuestions(filtered.length > 0 ? filtered : allQuestions);
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
    if (selectedOption === activeQuestions[currentStep].correctAnswer) {
      setScore(prev => prev + 1);
    }

    if (currentStep + 1 < activeQuestions.length) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setAppState('finished');
    }
  };

  const currentQuestion = activeQuestions[currentStep];
  const t = uiTranslations[settings.language];

  return (
      <Container maxWidth="sm" sx={{ mt: 4, position: 'relative' }}>
        {/* LANGUAGE SELECTOR */}
        <Box sx={{ position: 'absolute', top: -16, right: 16, zIndex: 10 }}>
          <IconButton
              onClick={handleOpenMenu}
              sx={{ p: 0.5, bgcolor: '#FFE600', '&:hover': { bgcolor: '#F0D800' } }}
          >
            <Avatar src={`/${settings.language}.png`} alt={settings.language} sx={{ width: 36, height: 36 }} />
          </IconButton>

          <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleCloseMenu}>
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
            {appState === 'setup' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="h5" align="center" sx={{ fontWeight: 'bold' }}>
                    {t.title}
                  </Typography>

                  {error && <Typography color="error" align="center">{error}</Typography>}

                  {/* TOGGLE SOLO OR MULTIPLAYER */}
                  <ToggleButtonGroup
                      value={playMode}
                      exclusive
                      fullWidth
                      onChange={(_, val) => val && setPlayMode(val)}
                  >
                    <ToggleButton value="solo">{t.soloMode}</ToggleButton>
                    <ToggleButton value="multiplayer">{t.multiMode}</ToggleButton>
                  </ToggleButtonGroup>

                  {/* SOLO SETUP */}
                  {playMode === 'solo' && (
                      <>
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

                        <Button variant="contained" size="large" fullWidth onClick={handleStartSoloQuiz} sx={{ mt: 1 }}>
                          {t.start}
                        </Button>
                      </>
                  )}

                  {/* MULTIPLAYER SETUP */}
                  {playMode === 'multiplayer' && (
                      <>
                        <ToggleButtonGroup
                            value={multiAction}
                            exclusive
                            fullWidth
                            size="small"
                            onChange={(_, val) => val && setMultiAction(val)}
                        >
                          <ToggleButton value="create">{t.createRoom}</ToggleButton>
                          <ToggleButton value="join">{t.joinRoom}</ToggleButton>
                        </ToggleButtonGroup>

                        <TextField
                            label={t.enterName}
                            fullWidth
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                        />

                        {multiAction === 'create' ? (
                            <>
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

                              <TextField
                                  label={t.maxPlayers}
                                  type="number"
                                  fullWidth
                                  value={maxPlayers}
                                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                              />

                              <Button variant="contained" size="large" fullWidth onClick={handleCreateRoom} sx={{ mt: 1 }}>
                                {t.createRoom}
                              </Button>
                            </>
                        ) : (
                            <>
                              <TextField
                                  label={t.roomCode}
                                  fullWidth
                                  slotProps={{ htmlInput: { maxLength: 4 } }}
                                  value={inputRoomCode}
                                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                              />
                              <TextField
                                  label={t.password}
                                  fullWidth
                                  slotProps={{ htmlInput: { maxLength: 4 } }}
                                  value={inputPassword}
                                  onChange={(e) => setInputPassword(e.target.value.toUpperCase())}
                              />
                              <Button variant="contained" size="large" fullWidth onClick={handleJoinRoom} sx={{ mt: 1 }}>
                                {t.joinRoom}
                              </Button>
                            </>
                        )}
                      </>
                  )}
                </Box>
            )}

            {/* LOBBY SCREEN SHOWING ROOM CODE & PASSWORD */}
            {appState === 'lobby' && activeRoom && (
                <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Quiz Lobby</Typography>

                  <Paper elevation={2} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Share with players:</Typography>
                    <Typography variant="h6" sx={{ letterSpacing: 2, mt: 1 }}>
                      ROOM CODE: <strong>{activeRoom.code}</strong>
                    </Typography>
                    <Typography variant="h6" sx={{ letterSpacing: 2 }}>
                      PIN: <strong>{activeRoom.pass}</strong>
                    </Typography>
                  </Paper>

                  <Typography variant="body2" color="text.secondary">
                    Waiting for host to launch the quiz...
                  </Typography>
                </Box>
            )}

            {appState === 'loading' && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
            )}

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
                        <FormControlLabel key={index} value={index} control={<Radio />} label={option} />
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

            {appState === 'finished' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {t.completed}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                    {t.score} {score} / {activeQuestions.length}
                  </Typography>
                  <Button variant="contained" onClick={() => setAppState('setup')}>
                    {t.restart}
                  </Button>
                </Box>
            )}
          </CardContent>
        </Card>
      </Container>
  );
}