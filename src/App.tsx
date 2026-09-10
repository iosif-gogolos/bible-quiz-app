import type { MouseEvent } from 'react';
import { useState, useEffect, useRef } from 'react';

import {
  Container, Card, CardContent, Typography,
  Button, RadioGroup, FormControlLabel, Radio, Box, LinearProgress,
  FormControl, FormLabel, Select, MenuItem, CircularProgress,
  IconButton, Menu, Avatar, TextField, ToggleButton, ToggleButtonGroup, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Chip
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import type { QuizSettings, Language, Difficulty, Question } from './types';
import { supabase } from './supabaseClient';
import { QuizRoom } from './QuizRoom';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
    gameModeLabel: 'Λειτουργία Παιχνιδιού',
    regularMode: 'Κανονικό',
    tournamentMode: 'Τουρνουά',
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
    points: 'Σκορ',
    participateLabel: 'Θέλω να συμμετάσχω στο κουίζ',
    stillPlaying: 'Παίζει ακόμα...',
    finishedStatus: 'Ολοκλήρωσε',
    launchNewQuiz: 'Έναρξη Νέου Κουίζ',
    wins: 'Νίκες',
    hostMonitoring: 'Πρόοδος Παικτών',
    youBadge: 'Εσύ',
    action: 'Ενέργεια',
    kickedMessage: 'Αφαιρεθήκατε από το δωμάτιο από τον οικοδεσπότη.'
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
    gameModeLabel: 'Game Mode',
    regularMode: 'Regular',
    tournamentMode: 'Tournament',
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
    points: 'Score',
    participateLabel: 'I want to participate in the quiz',
    stillPlaying: 'Still playing...',
    finishedStatus: 'Finished',
    launchNewQuiz: 'Launch New Quiz',
    wins: 'Parties Won',
    hostMonitoring: 'Player Progress',
    youBadge: 'You',
    action: 'Action',
    kickedMessage: 'You were removed from the room by the host.'
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
    gameModeLabel: 'Spielmodus',
    regularMode: 'Normal',
    tournamentMode: 'Turnier',
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
    points: 'Punkte',
    participateLabel: 'Ich möchte am Quiz teilnehmen',
    stillPlaying: 'Spielt noch...',
    finishedStatus: 'Fertig',
    launchNewQuiz: 'Neues Quiz starten',
    wins: 'Gewonnene Spiele',
    hostMonitoring: 'Spielerfortschritt',
    youBadge: 'Du',
    action: 'Aktion',
    kickedMessage: 'Du wurdest vom Gastgeber aus dem Raum entfernt.'
  }
};

interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

interface PlayerProgress {
  id: string;
  name: string;
  currentStep: number;
  total: number;
  status: 'playing' | 'finished';
  score: number;
}

export default function App() {
  const [playerId] = useState<string>(() => crypto.randomUUID());
  const [appState, setAppState] = useState<'setup' | 'lobby' | 'loading' | 'quiz' | 'waiting_results' | 'finished'>('setup');
  const [playMode, setPlayMode] = useState<'solo' | 'multiplayer'>('solo');
  const [gameMode, setGameMode] = useState<'regular' | 'tournament'>('regular');
  const [multiAction, setMultiAction] = useState<'create' | 'join'>('create');
  const [participateHost, setParticipateHost] = useState(true);

  const [settings, setSettings] = useState<QuizSettings>({
    language: 'el',
    difficulty: 'easy'
  });

  const [playerName, setPlayerName] = useState(() => localStorage.getItem('bible_quiz_player_name') || '');
  const [maxPlayers, setMaxPlayers] = useState<number | string>(5);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [activeRoom, setActiveRoom] = useState<{
    id: string;
    code: string;
    pass: string;
    isHost: boolean;
    hostParticipates: boolean;
    gameMode: 'regular' | 'tournament';
  } | null>(null);

  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [playerProgress, setPlayerProgress] = useState<Record<string, PlayerProgress>>({});
  const [partyWins, setPartyWins] = useState<Record<string, number>>({});

  const nameInputRef = useRef<HTMLInputElement>(null);
  const gameChannelRef = useRef<RealtimeChannel | null>(null);

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

  useEffect(() => {
    if (!activeRoom) return;

    const gameChannel = supabase.channel(`room_game:${activeRoom.id}`, {
      config: { broadcast: { self: true } }
    });

    gameChannelRef.current = gameChannel;

    gameChannel
        .on('broadcast', { event: 'progress_update' }, ({ payload }) => {
          setPlayerProgress((prev) => ({
            ...prev,
            [payload.id]: payload
          }));

          if (payload.status === 'finished') {
            setScores((prev) => {
              const exists = prev.some((p) => p.id === payload.id);
              if (exists) {
                return prev.map((p) => (p.id === payload.id ? { id: payload.id, name: payload.name, score: payload.score } : p));
              }
              return [...prev, { id: payload.id, name: payload.name, score: payload.score }];
            });
          }
        })
        .on('broadcast', { event: 'sync_wins' }, ({ payload }) => {
          if (payload?.wins) {
            setPartyWins(payload.wins);
          }
        })
        .on('broadcast', { event: 'kick_player' }, ({ payload }) => {
          if (payload?.targetPlayerId === playerId) {
            setActiveRoom(null);
            setAppState('setup');
            alert(uiTranslations[settings.language].kickedMessage);
          } else if (payload?.targetPlayerId) {
            setPlayerProgress((prev) => {
              const copy = { ...prev };
              delete copy[payload.targetPlayerId];
              return copy;
            });
            setScores((prev) => prev.filter((p) => p.id !== payload.targetPlayerId));
          }
        })
        .on('broadcast', { event: 'launch_new_quiz' }, () => {
          setAppState('lobby');
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
              } else if (payload.new && payload.new.status === 'waiting') {
                setAppState('lobby');
              }
            }
        )
        .subscribe();

    return () => {
      gameChannelRef.current = null;
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [activeRoom, playerId, settings.language]);

  useEffect(() => {
    if (appState !== 'waiting_results' || !activeRoom?.isHost) return;

    const progressList = Object.values(playerProgress);
    if (progressList.length > 0 && progressList.every((p) => p.status === 'finished')) {
      supabase
          .from('room')
          .update({ status: 'finished' })
          .eq('id', activeRoom.id)
          .then();
    }
  }, [playerProgress, appState, activeRoom]);

  // Host acts as central source of truth for win tallies and broadcasts to all clients
  useEffect(() => {
    if (appState === 'finished' && activeRoom?.isHost && scores.length > 0) {
      const maxScore = Math.max(...scores.map((s) => s.score));
      if (maxScore > 0) {
        const winners = scores.filter((s) => s.score === maxScore).map((s) => s.id);
        setPartyWins((prev) => {
          const updated = { ...prev };
          winners.forEach((wId) => {
            updated[wId] = (updated[wId] || 0) + 1;
          });
          gameChannelRef.current?.send({
            type: 'broadcast',
            event: 'sync_wins',
            payload: { wins: updated }
          });
          return updated;
        });
      }
    }
  }, [appState, activeRoom, scores]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleSelectLanguage = (lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
    handleCloseMenu();
  };

  const handleKickPlayer = async (targetPlayerId: string) => {
    if (!gameChannelRef.current) return;
    await gameChannelRef.current.send({
      type: 'broadcast',
      event: 'kick_player',
      payload: { targetPlayerId }
    });
    setPlayerProgress((prev) => {
      const copy = { ...prev };
      delete copy[targetPlayerId];
      return copy;
    });
    setScores((prev) => prev.filter((p) => p.id !== targetPlayerId));
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
              host_id: playerId,
              max_players: parsedMaxPlayers,
              language: settings.language,
              difficulty: settings.difficulty,
              game_mode: gameMode,
              status: 'waiting',
              host_participates: participateHost
            }
          ])
          .select()
          .single();

      if (dbError) throw dbError;

      setActiveRoom({
        id: data.id,
        code: generatedRoomName,
        pass: generatedPin,
        isHost: true,
        hostParticipates: participateHost,
        gameMode
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

      const isHostUser = matchedRoom.host_id === playerId;
      setActiveRoom({
        id: matchedRoom.id,
        code: matchedRoom.room_code,
        pass: matchedRoom.password,
        isHost: isHostUser,
        hostParticipates: matchedRoom.host_participates ?? true,
        gameMode: matchedRoom.game_mode || 'regular'
      });
      setAppState('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join room.');
      setAppState('setup');
    }
  };

  const broadcastProgress = async (step: number, total: number, isFinished: boolean, currentScore: number) => {
    if (!activeRoom || !gameChannelRef.current) return;
    await gameChannelRef.current.send({
      type: 'broadcast',
      event: 'progress_update',
      payload: {
        id: playerId,
        name: playerName,
        currentStep: step,
        total,
        status: isFinished ? 'finished' : 'playing',
        score: currentScore
      }
    });
  };

  const loadQuestionsAndStart = async () => {
    try {
      const response = await fetch(`/questions/${settings.language}.json`);
      if (!response.ok) throw new Error('Failed to load questions.');

      const allQuestions: Question[] = await response.json();
      const filtered = allQuestions.filter((q: Question) => q.difficulty === settings.difficulty);

      const chosenQuestions = filtered.length > 0 ? filtered : allQuestions;
      setActiveQuestions(chosenQuestions);
      setCurrentStep(0);
      setScore(0);
      setScores([]);
      setPlayerProgress({});
      setSelectedOption(null);

      if (activeRoom?.isHost && !activeRoom.hostParticipates) {
        setAppState('waiting_results');
      } else {
        setAppState('quiz');
        await broadcastProgress(0, chosenQuestions.length, false, 0);
      }
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

    const nextStep = currentStep + 1;
    if (nextStep < activeQuestions.length) {
      setCurrentStep(nextStep);
      setSelectedOption(null);
      if (playMode === 'multiplayer') {
        await broadcastProgress(nextStep, activeQuestions.length, false, finalScore);
      }
    } else {
      if (playMode === 'multiplayer' && activeRoom) {
        setAppState('waiting_results');
        await broadcastProgress(activeQuestions.length, activeQuestions.length, true, finalScore);
      } else {
        setAppState('finished');
      }
    }
  };

  const handleFinishQuizFromProgress = async () => {
    if (activeRoom?.isHost) {
      await supabase
          .from('room')
          .update({ status: 'finished' })
          .eq('id', activeRoom.id);
    }
  };

  const handleLaunchNewQuiz = async () => {
    if (!activeRoom) return;
    await supabase
        .from('room')
        .update({ status: 'waiting' })
        .eq('id', activeRoom.id);

    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'launch_new_quiz',
        payload: {}
      });
    }

    setAppState('lobby');
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
  const progressList = Object.values(playerProgress);

  return (
      <Container maxWidth="sm" sx={{ mt: 4, position: 'relative' }}>
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
                                <FormLabel sx={{ mb: 1 }}>{t.gameModeLabel}</FormLabel>
                                <Select
                                    value={gameMode}
                                    onChange={(e) => setGameMode(e.target.value as 'regular' | 'tournament')}
                                >
                                  <MenuItem value="regular">{t.regularMode}</MenuItem>
                                  <MenuItem value="tournament">{t.tournamentMode}</MenuItem>
                                </Select>
                              </FormControl>

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

                              <FormControlLabel
                                  control={
                                    <Checkbox
                                        checked={participateHost}
                                        onChange={(e) => setParticipateHost(e.target.checked)}
                                        color="primary"
                                    />
                                  }
                                  label={t.participateLabel}
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
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={handleLeaveLobby}
                        size="small"
                        sx={{ backgroundColor: '#E8DA4D', color: '#AC2F29', '&:hover': { backgroundColor: '#d8c93d' } }}
                    >
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

                    <Button
                        size="small"
                        startIcon={<ShareIcon />}
                        sx={{ mt: 2, backgroundColor: '#E8DA4D', color: '#AC2F29', '&:hover': { backgroundColor: '#d8c93d' } }}
                        onClick={handleShare}
                    >
                      {t.shareLink}
                    </Button>
                  </Paper>

                  <QuizRoom
                      roomId={activeRoom.id}
                      isHost={activeRoom.isHost}
                      hostParticipates={activeRoom.hostParticipates}
                      gameMode={activeRoom.gameMode}
                      playerName={playerName}
                      playerId={playerId}
                      onStartQuiz={loadQuestionsAndStart}
                      onKickPlayer={handleKickPlayer}
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

            {appState === 'waiting_results' && (
                <Box sx={{ textAlign: 'center', py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={50} />
                  <Typography variant="h6" color="text.secondary">
                    {activeRoom?.isHost && !activeRoom.hostParticipates ? t.hostMonitoring : t.waitingForOthers}
                  </Typography>

                  {progressList.length > 0 && (
                      <TableContainer component={Paper} elevation={1} sx={{ my: 2, borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                              <TableCell><strong>{t.player}</strong></TableCell>
                              <TableCell align="center"><strong>{t.question}</strong></TableCell>
                              <TableCell align="right"><strong>Status</strong></TableCell>
                              {activeRoom?.isHost && activeRoom.gameMode === 'tournament' && (
                                  <TableCell align="center"><strong>{t.action}</strong></TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {progressList.map((p) => {
                              const isCurrentUser = p.id === playerId;
                              return (
                                  <TableRow key={p.id}>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        {isCurrentUser && <PersonIcon color="primary" fontSize="small" />}
                                        <Typography variant="body2" sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                                          {p.name} {isCurrentUser ? `(${t.youBadge})` : ''}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center">{p.currentStep} / {p.total}</TableCell>
                                    <TableCell align="right">
                                      <Chip
                                          size="small"
                                          label={p.status === 'finished' ? t.finishedStatus : t.stillPlaying}
                                          color={p.status === 'finished' ? 'success' : 'warning'}
                                      />
                                    </TableCell>
                                    {activeRoom?.isHost && activeRoom.gameMode === 'tournament' && (
                                        <TableCell align="center">
                                          {!isCurrentUser && (
                                              <IconButton size="small" color="error" onClick={() => handleKickPlayer(p.id)}>
                                                <CloseIcon fontSize="small" />
                                              </IconButton>
                                          )}
                                        </TableCell>
                                    )}
                                  </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                  )}

                  {activeRoom?.isHost && (
                      <Button variant="contained" color="primary" onClick={handleFinishQuizFromProgress} sx={{ mt: 1 }}>
                        Show Final Scoreboard
                      </Button>
                  )}
                </Box>
            )}

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
                              <TableCell align="center"><strong>{t.wins}</strong></TableCell>
                              {activeRoom?.isHost && activeRoom.gameMode === 'tournament' && (
                                  <TableCell align="center"><strong>{t.action}</strong></TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sortedScores.map((row, idx) => {
                              const isCurrentUser = row.id === playerId;
                              return (
                                  <TableRow
                                      key={row.id}
                                      sx={{
                                        bgcolor: isCurrentUser ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                                      }}
                                  >
                                    <TableCell align="center">{idx + 1}</TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        {isCurrentUser && <PersonIcon color="primary" fontSize="small" />}
                                        <Typography variant="body2" sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                                          {row.name} {isCurrentUser ? `(${t.youBadge})` : ''}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right">{row.score} / {activeQuestions.length}</TableCell>
                                    <TableCell align="center">{partyWins[row.id] || 0}</TableCell>
                                    {activeRoom?.isHost && activeRoom.gameMode === 'tournament' && (
                                        <TableCell align="center">
                                          {!isCurrentUser && (
                                              <IconButton size="small" color="error" onClick={() => handleKickPlayer(row.id)}>
                                                <CloseIcon fontSize="small" />
                                              </IconButton>
                                          )}
                                        </TableCell>
                                    )}
                                  </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                  ) : (
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                        {t.score} {score} / {activeQuestions.length}
                      </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 2 }}>
                    {playMode === 'multiplayer' && activeRoom?.isHost && (
                        <Button variant="contained" color="primary" onClick={handleLaunchNewQuiz}>
                          {t.launchNewQuiz}
                        </Button>
                    )}

                    <Button
                        onClick={() => {
                          setActiveRoom(null);
                          setAppState('setup');
                        }}
                        sx={{ backgroundColor: '#E8DA4D', color: '#AC2F29', fontWeight: 'bold', '&:hover': { backgroundColor: '#d8c93d' } }}
                    >
                      {t.restart}
                    </Button>
                  </Box>
                </Box>
            )}
          </CardContent>
        </Card>
      </Container>
  );
}