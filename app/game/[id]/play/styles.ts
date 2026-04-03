import { styled, keyframes } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  IconButton,
  Chip,
  Paper,
  Button,
  Stack,
  Alert,
} from '@mui/material';

// ─── Animaciones ──────────────────────────────────────────────
export const dropIn = keyframes`
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); }
`;

export const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;

export const celebrate = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg) scale(1.1); }
  75% { transform: rotate(10deg) scale(1.1); }
`;

export const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

export const hourglassFlip = keyframes`
  0% { transform: rotateZ(0deg); }
  25% { transform: rotateZ(180deg); }
  50% { transform: rotateZ(180deg); }
  75% { transform: rotateZ(360deg); }
  100% { transform: rotateZ(360deg); }
`;

export const shuffleCard = keyframes`
  0% { transform: perspective(600px) rotateY(0deg); opacity: 1; }
  50% { transform: perspective(600px) rotateY(90deg); opacity: 0.5; }
  100% { transform: perspective(600px) rotateY(0deg); opacity: 1; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// ─── Containers ───────────────────────────────────────────────
export const PageWrapper = styled(Container)({
  // maxWidth passed as prop
});

export const CenteredFullHeight = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const CenteredStack = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

// ─── Header ───────────────────────────────────────────────────
export const HeaderCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderColor: theme.palette.secondary.main,
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
}));

export const HeaderCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  '&:last-child': { paddingBottom: theme.spacing(1.5) },
}));

export const HeaderTopRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(0.75),
}));

export const HeaderLeftGroup = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'center',
  minWidth: 0,
}));

export const HeaderGameIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  fontSize: 24,
  [theme.breakpoints.up('sm')]: {
    fontSize: 30,
  },
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: theme.typography.body1.fontSize,
  [theme.breakpoints.up('sm')]: {
    fontSize: theme.typography.h6.fontSize,
  },
}));

export const HeaderHomeButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.secondary.contrastText,
}));

export const HeaderRightGroup = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(0.5),
  alignItems: 'center',
}));

export const HeaderIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  width: 28,
  height: 28,
  backgroundColor: theme.palette.common.white,
  color: active ? theme.palette.primary.main : theme.palette.text.disabled,
  '&:hover': { backgroundColor: theme.palette.grey[100] },
}));

export const ConnectionBadge = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: 'connected' | 'reconnecting' | 'disconnected' }>(
  ({ theme, status }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: theme.palette.common.white,
    color:
      status === 'connected'
        ? theme.palette.success.main
        : status === 'reconnecting'
          ? theme.palette.warning.main
          : theme.palette.error.main,
  }),
);

export const SpinningIcon = styled('span')({
  display: 'inline-flex',
  animation: `${spin} 1s linear infinite`,
});

export const HeaderChipsRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(0.75),
  flexWrap: 'wrap',
  alignItems: 'center',
}));

export const StatusChip = styled(Chip)(({ theme }) => ({
  paddingLeft: theme.spacing(0.75),
  paddingRight: theme.spacing(0.75),
}));

export const HeaderChip = styled(Chip)(({ theme }) => ({
  paddingLeft: theme.spacing(0.75),
  paddingRight: theme.spacing(0.75),
  borderColor: 'rgba(255,255,255,0.5)',
  color: 'inherit',
  '& .MuiChip-icon': { color: 'inherit' },
}));

// ─── Alertas ──────────────────────────────────────────────────
export const SpacedAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const FullWidthAlert = styled(Alert)({
  width: '100%',
});

// ─── Tarjetas con hover ──────────────────────────────────────
const hoverMixin = {
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow:
      '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
  },
} as const;

// ─── Waiting state ────────────────────────────────────────────
export const WaitingCard = styled(Card)({
  ...hoverMixin,
});

export const WaitingCardContent = styled(CardContent)({});

export const WaitingStack = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(2),
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
}));

export const HourglassIcon = styled(Box)(({ theme }) => ({
  fontSize: 48,
  color: theme.palette.warning.main,
  display: 'flex',
  animation: `${hourglassFlip} 2.5s ease-in-out infinite`,
}));

export const WaitingTitle = styled(Typography)({
  textAlign: 'center',
});

export const WaitingHint = styled(Typography)({
  textAlign: 'center',
});

export const ChangeCardButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

// ─── Playing state: last ball + bingo ─────────────────────────
export const PlayingCard = styled(Card)(({ theme }) => ({
  ...hoverMixin,
  marginBottom: theme.spacing(0.5),
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(1),
  },
}));

export const PlayingCardContent = styled(CardContent)({});

export const PlayingRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

export const LastBallGroup = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(2),
  flex: 1,
}));

export const LastBallPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'ballColor',
})<{ ballColor: string }>(({ ballColor }) => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: ballColor,
  color: '#fff',
  flexShrink: 0,
  animation: `${dropIn} 0.5s ease-out`,
}));

export const BallLetter = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: theme.typography.caption.fontSize,
  lineHeight: 1,
}));

export const BallNumber = styled(Typography)({
  fontWeight: 'bold',
  lineHeight: 1,
});

export const EmptyBallPaper = styled(Paper)(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.action.hover,
  flexShrink: 0,
}));

export const LastBallInfoStack = styled(Stack)({});

export const LastBallLabel = styled(Typography)({
  fontWeight: 'bold',
});

export const LastBallCount = styled(Typography)({});

export const BingoButton = styled(Button)(({ theme }) => ({
  minWidth: 100,
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  fontWeight: 'bold',
  fontSize: theme.typography.body1.fontSize,
  borderRadius: theme.spacing(1.5),
  transition: 'transform 0.2s',
  '&:hover:not(:disabled)': { transform: 'scale(1.05)' },
}));

// ─── Winner state ─────────────────────────────────────────────
export const WinnerCard = styled(Card)(({ theme }) => ({
  borderColor: theme.palette.warning.main,
  overflow: 'visible',
}));

export const WinnerCardContent = styled(CardContent)({});

export const WinnerStack = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));

export const WinnerTrophyIcon = styled(Box)(({ theme }) => ({
  fontSize: 48,
  color: theme.palette.warning.main,
  display: 'flex',
  animation: `${celebrate} 1s ease-in-out infinite`,
}));

export const WinnerTitle = styled(Typography)({
  textAlign: 'center',
});

export const WinnerRound = styled(Typography)({});

export const WinnerCelebrationIcon = styled(Box)(({ theme }) => ({
  fontSize: 32,
  color: theme.palette.success.main,
  display: 'flex',
  animation: `${celebrate} 0.8s ease-in-out infinite`,
  animationDelay: '0.2s',
}));

// ─── Finished (no winner) state ──────────────────────────────
export const FinishedCard = styled(Card)(({ theme }) => ({
  borderColor: theme.palette.error.main,
}));

export const FinishedCardContent = styled(CardContent)({});

export const FinishedStack = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));

export const FinishedStopIcon = styled(Box)(({ theme }) => ({
  fontSize: 48,
  color: theme.palette.error.main,
  display: 'flex',
}));

export const FinishedTitle = styled(Typography)({
  textAlign: 'center',
});

export const FinishedRound = styled(Typography)({
  textAlign: 'center',
});

// ─── Bingo card ───────────────────────────────────────────────
export const BingoCardOuter = styled(Card)({
  ...hoverMixin,
});

export const BingoCardContent = styled(CardContent)(({ theme }) => ({
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
}));

export const BingoCardHeaderRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
}));

export const BingoCardTitleGroup = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'center',
}));

export const BingoLettersGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: theme.spacing(0.5),
  marginBottom: theme.spacing(0.5),
  [theme.breakpoints.up('sm')]: {
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

export const BingoLetterCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'bgColor',
})<{ bgColor: string }>(({ theme, bgColor }) => ({
  textAlign: 'center',
  paddingTop: theme.spacing(0.75),
  paddingBottom: theme.spacing(0.75),
  borderRadius: theme.spacing(0.5),
  backgroundColor: bgColor,
  color: '#fff',
  fontWeight: 'bold',
  fontSize: theme.typography.body1.fontSize,
  [theme.breakpoints.up('sm')]: {
    fontSize: theme.typography.h6.fontSize,
  },
}));

export const BingoCellsGrid = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'animating',
})<{ animating: boolean }>(({ theme, animating }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: theme.spacing(0.5),
  transformStyle: 'preserve-3d',
  [theme.breakpoints.up('sm')]: {
    gap: theme.spacing(1),
  },
  ...(animating && {
    animation: `${shuffleCard} 0.5s ease-in-out`,
  }),
}));

export const BingoCell = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'isFree' &&
    prop !== 'isMarked' &&
    prop !== 'isCalled' &&
    prop !== 'canMark' &&
    prop !== 'isPlaying' &&
    prop !== 'colColor',
})<{
  isFree: boolean;
  isMarked: boolean;
  isCalled: boolean;
  canMark: boolean;
  isPlaying: boolean;
  colColor: string;
}>(({ theme, isFree, isMarked, isCalled, canMark, isPlaying, colColor }) => ({
  aspectRatio: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.spacing(0.75),
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 'bold',
  cursor: canMark ? 'pointer' : 'default',
  userSelect: 'none',
  position: 'relative',
  transition: 'all 0.2s ease',
  [theme.breakpoints.up('sm')]: {
    fontSize: theme.typography.h6.fontSize,
  },
  // Celda libre (centro)
  ...(isFree && {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  }),
  // Marcado por el jugador
  ...(!isFree &&
    isMarked && {
      backgroundColor: colColor,
      color: '#fff',
      animation: `${popIn} 0.3s ease-out`,
    }),
  // Cantado pero no marcado
  ...(!isFree &&
    !isMarked &&
    isCalled && {
      backgroundColor: theme.palette.action.selected,
      color: theme.palette.text.primary,
      border: '2px solid',
      borderColor: colColor,
      ...(isPlaying && {
        '&:hover': { transform: 'scale(1.08)', boxShadow: theme.shadows[3] },
      }),
    }),
  // No cantado aún
  ...(!isFree &&
    !isCalled && {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.secondary,
    }),
}));

export const CellCheckIcon = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 1,
  right: 1,
  display: 'flex',
  fontSize: 10,
  color: 'rgba(255,255,255,0.7)',
  [theme.breakpoints.up('sm')]: {
    fontSize: 12,
  },
}));

// ─── Legend ────────────────────────────────────────────────────
export const LegendRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  justifyContent: 'center',
  marginTop: theme.spacing(2),
  flexWrap: 'wrap',
  [theme.breakpoints.up('sm')]: {
    gap: theme.spacing(2),
  },
}));

export const LegendItem = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(0.5),
  alignItems: 'center',
}));

export const LegendDotMarked = styled(Box)(({ theme }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
}));

export const LegendDotCalled = styled(Box)(({ theme }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  border: '2px solid',
  borderColor: theme.palette.primary.main,
  backgroundColor: theme.palette.action.selected,
}));

export const LegendDotUncalled = styled(Box)(({ theme }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: theme.palette.action.hover,
}));

export const LegendLabel = styled(Typography)({});

// ─── Footer ───────────────────────────────────────────────────
export const Footer = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(3),
  display: 'block',
  textAlign: 'center',
}));

// ─── Win pattern preview ──────────────────────────────────────
export const PatternPreviewStack = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(0.75),
}));

export const PatternPreviewLabel = styled(Typography)({
  fontWeight: 'bold',
});

export const PatternPreviewGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 3,
  width: 80,
  height: 80,
});

export const PatternPreviewCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ theme, active }) => ({
  borderRadius: theme.spacing(0.25),
  backgroundColor: active
    ? theme.palette.primary.main
    : theme.palette.action.hover,
  opacity: active ? 1 : 1,
  transition: 'all 0.3s',
}));

// ─── Disconnection alert ──────────────────────────────────────
export const DisconnectionAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

// ─── Bingo result alert ──────────────────────────────────────
export const BingoResultAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

// ─── Notification alert ──────────────────────────────────────
export const NotificationAlert = styled(Alert)({
  width: '100%',
  boxShadow:
    '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
});

export const AdminMessageAlert = styled(Alert)({
  width: '100%',
  boxShadow:
    '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
});
