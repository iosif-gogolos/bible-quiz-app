import type { MouseEvent } from 'react';
import { useState, useEffect, useRef } from 'react';

import {
  Container, Card, CardContent, Typography,
  Button, RadioGroup, FormControlLabel, Radio, Box, LinearProgress,
  FormControl, FormLabel, Select, MenuItem, CircularProgress,
  IconButton, Menu, Avatar, TextField, ToggleButton, ToggleButtonGroup, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { QuizSettings, Language, Difficulty, Question } from './types';
import { supabase } from './supabaseClient';
import { QuizRoom } from './QuizRoom';

const generatePin = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const biblicalCities = {
  el: ['Ιερουσαλήμ', 'Βηθλεέμ', 'Ναζαρέτ', 'Καπερναούμ', 'Βηθανία', 'Ιεριχώ', 'Κανά', 'Αντιόχεια', 'Έφεσος', 'Κόρινθος', 'Φίλιπποι', 'Θεσσαλονίκη', 'Aθήνα'],
  en: ['Jerusalem', 'Bethlehem', 'Nazareth', 'Capernaum', 'Bethany', 'Jericho', 'Cana', 'Antioch', 'Ephesus', 'Corinth', 'Philippi', 'Thessalonica', 'Athens'],
  de: ['Jerusalem', 'Bethlehem', 'Nazareth', 'Kapernaum', 'Bethanien', 'Jericho', 'Kana', 'Antiochia', 'Ephesus', 'Korinth', 'Philippi', 'Thessalonich', 'Athen']
} as const;

const getRandomBiblicalCity = (language: Language): string => {
  const cities = biblicalCities[language];
  return cities[Math.floor(Math.random() * cities.length)];
};

const uiTranslations = {
  el: {
    title: 'Βιβλικό Κουίζ',
    difficultyLabel: 'Βαθμός δυσκολίας',
    easy: 'Εύκολο (π.χ. για Κυριακό)',
    medium: 'Μέτριο (π.χ. για Εφηβικό)',
    hard: 'Δύσκολο (π.χ. για Νεολαία και Μεγάλους)',
    start: 'Έναρξη',
    createRoom: 'Δημιουργία Δωματίου',
    joinRoom: 'Σύνδεση σε Δωμάτιο',
    soloMode: 'Μονός Παίκτης',
    multiMode: 'Πολλαπλοί Παίκτες',
    roomName: 'Όνομα Δωματίου',
    password: 'PIN / Κωδικός',
    maxPlayers: 'Μέγιστος Αριθμός Παικτών',
    enterName: 'Το όνομά σου',
    question: 'Ερώτηση',
    of: 'από',
    finish: 'Ολοκλήρωση',
    next: 'Επόμενη Ερώτηση',
    completed: 'Ολοκληρώθηκε!',
    score: 'Το σκορ σου:',
    restart: 'Πίσω στην αρχική σελίδα',
    quizLobby: 'Λόμπι Κουίζ',
    shareWithPlayers: 'Μοιράσου με τους παίκτες:',
    pin: 'PIN',
    shareLink: 'Κοινοποίηση συνδέσμου',
    leaveLobby: 'Έξοδος',
    joinedPlayers: 'Συνδεδεμένοι Παίκτες',
    launchQuiz: 'Έναρξη Κουίζ',
    waitingForHost: 'Αναμονή για τον οικοδεσπότη να ξεκινήσει το κουίζ...',
    startsIn: 'Το κουίζ ξεκινά σε:',
    confirmTitle: 'Έναρξη Κουίζ;',
    confirmDesc: 'συνδεδεμένοι χρήστες. Είναι έτοιμοι για την έναρξη;',
    cancel: 'Ακύρωση',
    confirmStart: 'Ναι, Έναρξη',
    waitingForOthers: 'Αναμονή για τους υπόλοιπους παίκτες...',
    leaderboardTitle: 'Τελική Κατάταξη',
    rank: 'Θέση',
    player: 'Παίκτης',
    points: 'Σκορ'
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
    roomName: 'Room Name',
    password: 'PIN / Password',
    maxPlayers: 'Max Players',
    enterName: 'Your Nickname',
    question: 'Question',
    of: 'of',
    finish: 'Finish Quiz',
    next: 'Next Question',
    completed: 'Quiz Completed!',
    score: 'Your Score:',
    restart: 'Back to home screen',
    quizLobby: 'Quiz Lobby',
    shareWithPlayers: 'Share with players:',
    pin: 'PIN',
    shareLink: 'Share Link',
    leaveLobby: 'Leave',
    joinedPlayers: 'Joined Players',
    launchQuiz: 'Launch Quiz',
    waitingForHost: 'Waiting for host to launch the quiz...',
    startsIn: 'Quiz starts in:',
    confirmTitle: 'Launch Quiz?',
    confirmDesc: 'users connected. Are they ready to launch the quiz?',
    cancel: 'Cancel',
    confirmStart: 'Yes, Start',
    waitingForOthers: 'Waiting for other players to finish...',
    leaderboardTitle: 'Final Leaderboard',
    rank: 'Rank',
    player: 'Player',
    points: 'Score'
  },
  de: {
    title: 'Bibel-Quiz',
    difficultyLabel: 'Schwierigkeit',
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Schwer',
    start: 'Einzelspieler starten',
    createRoom: 'Raum erstellen',
    joinRoom: 'Raum beitreten',
    soloMode: 'Einzelspieler',
    multiMode: 'Mehrspieler',
    roomName: 'Raumname',
    password: 'PIN / Passwort',
    maxPlayers: 'Max. Spieler',
    enterName: 'Dein Name',
    question: 'Frage',
    of: 'von',
    finish: 'Quiz beenden',
    next: 'Nächste Frage',
    completed: 'Quiz beendet!',
    score: 'Dein Ergebnis:',
    restart: 'Zurück zum Startbildschirm',
    quizLobby: 'Quiz-Lobby',
    shareWithPlayers: 'Mit Spielern teilen:',
    pin: 'PIN',
    shareLink: 'Link teilen',
    leaveLobby: 'Verlassen',
    joinedPlayers: 'Verbundene Spieler',
    launchQuiz: 'Quiz Starten',
    waitingForHost: 'Warten auf den Gastgeber...',
    startsIn: 'Quiz startet in:',
    confirmTitle: 'Quiz starten?',
    confirmDesc: 'Benutzer verbunden. Bereit zum Starten?',
    cancel: 'Abbrechen',
    confirmStart: 'Ja, Starten',
    waitingForOthers: 'Warten auf andere Spieler...',
    leaderboardTitle: 'Rangliste',
    rank: 'Platz',
    player: 'Spieler',
    points: 'Punkte'
  }
};

interface PlayerScore {
  name: string;
  score: number;
}

export default function App() {
  const [appState, setAppState] = useState<'setup' | 'lobby' | 'loading' | 'quiz' | 'waiting_results' | 'finished'>('setup');
  const [playMode, setPlayMode] = useState<'solo' | 'multiplayer'>('solo');
  const [multiAction, setMultiAction] = useState<'create' | 'join'>('create');

  const [settings, setSettings] = useState<QuizSettings>({
    language: 'el',
    difficulty: 'easy'
  });

  const [playerName, setPlayerName] = useState(() => localStorage.getItem('bible_quiz_player_name') || '');
  const [maxPlayers, setMaxPlayers] = useState<number | string>(5);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [activeRoom, setActiveRoom] = useState<{ id: string; code: string; pass: string; isHost: boolean } | null>(null);

  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [scores, setScores] = useState<PlayerScore[]>([]);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (playerName) {
      localStorage.setItem('bible_quiz_player_name', playerName);
    }
  }, [playerName]);

  useEffect(() => {
    document.body.style.backgroundImage = appState === 'quiz'
        ? 'url("/background-quiz.png")'
        : 'url("/bg-launch-screen.png");';
  }, [appState]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const pinParam = params.get('pin');
    if (roomParam && pinParam) {
      setInputRoomCode(roomParam);
      setInputPassword(pinParam);
      setPlayMode('multiplayer');
      setMultiAction('join');

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, []);

  // Listen for realtime score submissions & database room status updates
  useEffect(() => {
    if (!activeRoom) return;

    const gameChannel = supabase.channel(`room_game:${activeRoom.id}`, {
      config: { broadcast: { self: true } }
    });

    gameChannel
        .on('broadcast', { event: 'submit_score' }, ({ payload }) => {
          setScores((prev) => {
            const exists = prev.some((p) => p.name === payload.name);
            if (exists) return prev.map((p) => (p.name === payload.name ? payload : p));
            return [...prev, payload];
          });
        })
        .subscribe();

    const roomChannel = supabase
        .channel(`room_status_app:${activeRoom.id}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'room', filter: `id=eq.${activeRoom.id}` },
            (payload) => {
              if (payload.new && payload.new.status === 'finished') {
                setAppState('finished');
              }
            }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [activeRoom]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleSelectLanguage = (lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
    handleCloseMenu();
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    setAppState('loading');
    setError(null);

    const generatedRoomName = getRandomBiblicalCity(settings.language);
    const generatedPin = generatePin();
    const parsedMaxPlayers = typeof maxPlayers === 'string' ? parseInt(maxPlayers, 10) || 5 : maxPlayers;

    try {
      const { data, error: dbError } = await supabase
          .from('room')
          .insert([
            {
              room_code: generatedRoomName,
              password: generatedPin,
              host_id: playerName.trim(),
              max_players: parsedMaxPlayers,
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
        code: generatedRoomName,
        pass: generatedPin,
        isHost: true
      });
      setAppState('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room.');
      setAppState('setup');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!inputRoomCode.trim() || !inputPassword.trim()) {
      setError('Please enter your name, room code, and password.');
      return;
    }

    setAppState('loading');
    setError(null);

    try {
      const { data, error: dbError } = await supabase
          .from('room')
          .select('*')
          .eq('password', inputPassword.trim().toUpperCase());

      if (dbError || !data || data.length === 0) {
        throw new Error('Invalid room code or password.');
      }

      const matchedRoom = data.find(
          (r) =>
              r.room_code.trim().localeCompare(inputRoomCode.trim(), 'el', { sensitivity: 'accent' }) === 0 ||
              r.room_code.trim() === inputRoomCode.trim()
      );

      if (!matchedRoom) {
        throw new Error('Invalid room code or password.');
      }

      setSettings((prev) => ({
        ...prev,
        language: matchedRoom.language || prev.language,
        difficulty: matchedRoom.difficulty || prev.difficulty
      }));

      setActiveRoom({
        id: matchedRoom.id,
        code: matchedRoom.room_code,
        pass: matchedRoom.password,
        isHost: matchedRoom.host_id.trim().toLowerCase() === playerName.trim().toLowerCase()
      });
      setAppState('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join room.');
      setAppState('setup');
    }
  };

  const loadQuestionsAndStart = async () => {
    try {
      const response = await fetch(`/questions/${settings.language}.json`);
      if (!response.ok) throw new Error('Failed to load questions.');

      const allQuestions: Question[] = await response.json();
      const filtered = allQuestions.filter((q: Question) => q.difficulty === settings.difficulty);

      setActiveQuestions(filtered.length > 0 ? filtered : allQuestions);
      setCurrentStep(0);
      setScore(0);
      setScores([]);
      setSelectedOption(null);
      setAppState('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAppState('setup');
    }
  };

  const handleStartSoloQuiz = async () => {
    setAppState('loading');
    setError(null);
    await loadQuestionsAndStart();
  };

  const handleNext = async () => {
    const isCorrect = selectedOption === activeQuestions[currentStep].correctAnswer;
    const finalScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      setScore(finalScore);
    }

    if (currentStep + 1 < activeQuestions.length) {
      setCurrentStep((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      if (playMode === 'multiplayer' && activeRoom) {
        setAppState('waiting_results');

        // Broadcast current user's score to the room
        const channel = supabase.channel(`room_game:${activeRoom.id}`);
        await channel.send({
          type: 'broadcast',
          event: 'submit_score',
          payload: { name: playerName, score: finalScore }
        });

        // If Host, check or finish room status in Supabase database
        if (activeRoom.isHost) {
          await supabase
              .from('room')
              .update({ status: 'finished' })
              .eq('id', activeRoom.id);
        }
      } else {
        setAppState('finished');
      }
    }
  };

  const handleShare = async () => {
    if (!activeRoom) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(activeRoom.code)}&pin=${encodeURIComponent(activeRoom.pass)}`;
    const shareData = {
      title: t.title,
      text: `Join my Bible Quiz room! Room: ${activeRoom.code}, PIN: ${activeRoom.pass}`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleLeaveLobby = () => {
    setActiveRoom(null);
    setAppState('setup');
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const currentQuestion = activeQuestions[currentStep];
  const t = uiTranslations[settings.language];

  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
      <Container maxWidth="sm" sx={{ mt: 4, position: 'relative' }}>
        {/* Language switcher - ONLY visible on initial setup screen */}
        {appState === 'setup' && (
            <Box sx={{ position: 'absolute', top: -16, right: 16, zIndex: 10 }}>
              <IconButton onClick={handleOpenMenu} sx={{ p: 0.5, bgcolor: '#FFE600', '&:hover': { bgcolor: '#F0D800' } }}>
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
        )}

        <Card elevation={4} sx={{ borderRadius: '16px', mt: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {appState === 'setup' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="h5" align="center" sx={{ fontWeight: 'bold' }}>
                    {t.title}
                  </Typography>

                  {error && <Typography color="error" align="center">{error}</Typography>}

                  <ToggleButtonGroup value={playMode} exclusive fullWidth onChange={(_, val) => val && setPlayMode(val)}>
                    <ToggleButton value="solo">{t.soloMode}</ToggleButton>
                    <ToggleButton value="multiplayer">{t.multiMode}</ToggleButton>
                  </ToggleButtonGroup>

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
                            inputRef={nameInputRef}
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
                                  type="text"
                                  inputMode="numeric"
                                  fullWidth
                                  value={maxPlayers}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d+$/.test(val)) {
                                      setMaxPlayers(val === '' ? '' : Number(val));
                                    }
                                  }}
                              />

                              <Button variant="contained" size="large" fullWidth onClick={handleCreateRoom} sx={{ mt: 1 }}>
                                {t.createRoom}
                              </Button>
                            </>
                        ) : (
                            <>
                              <TextField
                                  label={t.roomName}
                                  fullWidth
                                  value={inputRoomCode}
                                  onChange={(e) => setInputRoomCode(e.target.value)}
                              />

                              <TextField
                                  label={t.password}
                                  fullWidth
                                  slotProps={{
                                    htmlInput: {
                                      maxLength: 4,
                                      style: { textTransform: 'uppercase' }
                                    }
                                  }}
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

            {appState === 'lobby' && activeRoom && (
                <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={handleLeaveLobby} size="small" variant="outlined">
                      {t.leaveLobby}
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', flexGrow: 1, textAlign: 'center', pr: 8 }}>
                      {t.quizLobby}
                    </Typography>
                  </Box>

                  <Paper elevation={2} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t.shareWithPlayers}
                    </Typography>

                    <Typography variant="h6" sx={{ letterSpacing: 2, mt: 1, textTransform: 'none' }}>
                      {t.roomName}: <strong>{activeRoom.code}</strong>
                    </Typography>

                    <Typography variant="h6" sx={{ letterSpacing: 2 }}>
                      {t.pin}: <strong>{activeRoom.pass}</strong>
                    </Typography>

                    <Button variant="outlined" size="small" startIcon={<ShareIcon />} sx={{ mt: 2 }} onClick={handleShare}>
                      {t.shareLink}
                    </Button>
                  </Paper>

                  <QuizRoom
                      roomId={activeRoom.id}
                      isHost={activeRoom.isHost}
                      playerName={playerName}
                      onStartQuiz={loadQuestionsAndStart}
                      t={t}
                  />
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

            {/* Waiting for other players indicator with loading spinner */}
            {appState === 'waiting_results' && (
                <Box sx={{ textAlign: 'center', py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <CircularProgress size={60} />
                  <Typography variant="h6" color="text.secondary">
                    {t.waitingForOthers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.score} {score} / {activeQuestions.length}
                  </Typography>
                </Box>
            )}

            {/* Final leaderboard / ranking view */}
            {appState === 'finished' && (
                <Box sx={{ textAlign: 'center' }}>
                  <EmojiEventsIcon sx={{ fontSize: 60, color: '#fbc02d', mb: 1 }} />
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {t.leaderboardTitle}
                  </Typography>

                  {playMode === 'multiplayer' && sortedScores.length > 0 ? (
                      <TableContainer component={Paper} elevation={1} sx={{ my: 3, borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                              <TableCell align="center"><strong>{t.rank}</strong></TableCell>
                              <TableCell><strong>{t.player}</strong></TableCell>
                              <TableCell align="right"><strong>{t.points}</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sortedScores.map((row, idx) => (
                                <TableRow
                                    key={idx}
                                    sx={{
                                      bgcolor: row.name === playerName ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                                    }}
                                >
                                  <TableCell align="center">{idx + 1}</TableCell>
                                  <TableCell>{row.name}</TableCell>
                                  <TableCell align="right">{row.score} / {activeQuestions.length}</TableCell>
                                </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                  ) : (
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                        {t.score} {score} / {activeQuestions.length}
                      </Typography>
                  )}

                  <Button
                      variant="contained"
                      onClick={() => {
                        setActiveRoom(null);
                        setAppState('setup');
                      }}
                  >
                    {t.restart}
                  </Button>
                </Box>
            )}
          </CardContent>
        </Card>
      </Container>
  );
}