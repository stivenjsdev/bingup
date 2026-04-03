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
  Avatar,
  Badge,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  TextField,
  Divider,
} from '@mui/material';

// ─── Animaciones ──────────────────────────────────────────────
export const dropIn = keyframes`
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); }
`;

export const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(25, 118, 210, 0.3); }
  50% { box-shadow: 0 0 20px rgba(25, 118, 210, 0.6); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// ─── Containers ───────────────────────────────────────────────
export const PageWrapper = styled(Container)({
  // maxWidth is passed as prop
});

export const ErrorWrapper = styled(Container)({
  // maxWidth="sm" variant
});

// ─── Layout ───────────────────────────────────────────────────
export const CenteredFullHeight = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const CenteredStack = styled(Stack)({
  alignItems: 'center',
  gap: 16,
});

export const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
  },
}));

export const MainLayout = styled(Stack)(({ theme }) => ({
  flexDirection: 'column',
  gap: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
  },
}));

export const LeftColumn = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
  flex: 1,
  minWidth: 0,
}));

// ─── Header ───────────────────────────────────────────────────
export const HeaderCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderColor: theme.palette.primary.main,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(3),
  },
}));

export const HeaderCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  '&:last-child': { paddingBottom: theme.spacing(2) },
}));

export const HeaderTopRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

export const HeaderLeftGroup = styled(Stack)({
  flexDirection: 'row',
  gap: 8,
  alignItems: 'center',
  minWidth: 0,
});

export const HeaderRightGroup = styled(Stack)({
  flexDirection: 'row',
  gap: 4,
  alignItems: 'center',
});

export const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: theme.typography.h6.fontSize,
  [theme.breakpoints.up('sm')]: {
    fontSize: theme.typography.h5.fontSize,
  },
}));

export const HeaderGameIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  fontSize: 28,
  [theme.breakpoints.up('sm')]: {
    fontSize: 36,
  },
}));

export const HeaderHomeButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
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
})<{ status: 'connected' | 'reconnecting' | 'disconnected' }>(({ theme, status }) => ({
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
}));

export const SpinningIcon = styled('span')({
  display: 'inline-flex',
  animation: `${spin} 1s linear infinite`,
});

export const HeaderChipsRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(0.75),
  flexWrap: 'wrap',
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

// ─── Código de sala ───────────────────────────────────────────
export const RoomCodeCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(3),
  },
}));

export const RoomCodeCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  '&:last-child': { paddingBottom: theme.spacing(1.5) },
}));

export const RoomCodeRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

export const RoomCodeLeft = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'center',
  minWidth: 0,
  flex: 1,
}));

export const RoomCodeText = styled(Typography)({
  fontFamily: 'monospace',
  fontWeight: 'bold',
  letterSpacing: 0.5,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const CopyButton = styled(IconButton)({
  flexShrink: 0,
});

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
  '&:hover': { boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)' },
} as const;

export const HoverCard = styled(Card)({
  ...hoverMixin,
});

export const ControlsCard = styled(Card)(({ theme }) => ({
  borderColor: theme.palette.primary.main,
  ...hoverMixin,
}));

export const WinnersCard = styled(Card)(({ theme }) => ({
  borderColor: theme.palette.warning.main,
  ...hoverMixin,
}));

export const BoardCard = styled(Card)({
  flex: 1,
  minWidth: 0,
  ...hoverMixin,
});

// ─── Secciones (título con icono) ─────────────────────────────
export const SectionHeader = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

export const SectionHeaderCompact = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

export const SectionHeaderMedium = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
}));

// ─── Controles del juego ──────────────────────────────────────
export const ControlsStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

export const PlayingStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  alignItems: 'center',
}));

export const AutoDrawRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'center',
  width: '100%',
}));

export const SecondsInput = styled(TextField)({
  width: 100,
});

export const ConfirmStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1),
}));

export const RestartOptionsStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

// ─── Botón de acción principal ────────────────────────────────
export const ActionButton = styled(Button)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  fontSize: theme.typography.body1.fontSize,
  transition: 'transform 0.2s',
  '&:hover:not(:disabled)': { transform: 'scale(1.02)' },
  [theme.breakpoints.up('sm')]: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    fontSize: theme.typography.h6.fontSize,
  },
}));

// ─── Balota (última sacada) ──────────────────────────────────
export const BallPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'ballColor',
})<{ ballColor: string }>(({ theme, ballColor }) => ({
  width: 100,
  height: 100,
  borderRadius: '50%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: ballColor,
  color: '#fff',
  animation: `${dropIn} 0.5s ease-out`,
  [theme.breakpoints.up('sm')]: {
    width: 100,
    height: 100,
  },
}));

export const BallLetter = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: theme.typography.body2.fontSize,
  lineHeight: 1,
}));

export const BallNumber = styled(Typography)({
  fontWeight: 'bold',
  lineHeight: 1,
});

// ─── Tablero de balotas ──────────────────────────────────────
export const BoardColumnsStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
}));

export const ColumnHeaderRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(0.5),
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

export const ColumnDivider = styled(Divider)({
  flex: 1,
});

export const ColumnLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'labelColor',
})<{ labelColor: string }>(({ labelColor }) => ({
  fontWeight: 'bold',
  color: labelColor,
  width: 20,
  textAlign: 'center',
}));

export const BallsGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  paddingLeft: theme.spacing(0.5),
}));

export const BoardBall = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'called' && prop !== 'last' && prop !== 'ballColor',
})<{ called: boolean; last: boolean; ballColor: string }>(
  ({ theme, called, last, ballColor }) => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: theme.typography.caption.fontSize,
    fontWeight: called ? 'bold' : 'normal',
    backgroundColor: called ? ballColor : theme.palette.action.hover,
    color: called ? '#fff' : theme.palette.text.disabled,
    transition: 'all 0.3s ease',
    [theme.breakpoints.up('sm')]: {
      width: 34,
      height: 34,
    },
    ...(last && {
      animation: `${glow} 1.5s ease-in-out infinite`,
      transform: 'scale(1.15)',
    }),
  }),
);

// ─── Jugadores ────────────────────────────────────────────────
export const PlayersHeaderRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

export const PlayersLeftGroup = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
  alignItems: 'center',
}));

export const PlayersBadgesGroup = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(0.5),
  alignItems: 'center',
}));

export const OnlineChip = styled(Chip)({
  '& .MuiChip-icon': { color: 'inherit' },
});

export const PlayerListItem = styled(ListItem)(({ theme }) => ({
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
}));

export const PlayerIconCell = styled(ListItemIcon)({
  minWidth: 40,
});

export const PlayerAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'index' && prop !== 'online',
})<{ index: number; online: boolean }>(({ theme, index, online }) => ({
  width: 30,
  height: 30,
  fontSize: theme.typography.body2.fontSize,
  backgroundColor: `hsl(${(index * 47) % 360}, 60%, 45%)`,
  opacity: online ? 1 : 0.5,
}));

export const PlayerBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== 'online',
})<{ online: boolean }>(({ theme, online }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: online ? theme.palette.success.main : theme.palette.error.main,
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '2px solid',
    borderColor: theme.palette.background.paper,
  },
}));

export const PlayerStatusText = styled(ListItemText, {
  shouldForwardProp: (prop) => prop !== 'online',
})<{ online: boolean }>(({ theme, online }) => ({
  '& .MuiListItemText-secondary': {
    color: online ? theme.palette.success.main : theme.palette.error.main,
    fontSize: theme.typography.caption.fontSize,
  },
}));

export const EmptyPlayersText = styled(Typography)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  textAlign: 'center',
}));

// ─── Mensaje global ───────────────────────────────────────────
export const MessageRow = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(1),
}));

// ─── Ganadores ────────────────────────────────────────────────
export const WinnerListItem = styled(ListItem)(({ theme }) => ({
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
}));

export const WinnerIconCell = styled(ListItemIcon)({
  minWidth: 40,
});

export const WinnerAvatar = styled(Avatar)(({ theme }) => ({
  width: 30,
  height: 30,
  fontSize: theme.typography.body2.fontSize,
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.warning.contrastText,
}));
