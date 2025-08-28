import { useState } from 'react';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
	Box,
	Chip,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
} from '@mui/material';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/Auth/context/AuthContext';

const routeConfig = [
	// {
	// 	name: '首頁',
	// 	path: 'main',
	// 	icon: <HomeIcon />,
	// },
	{
		name: '託運單',
		path: 'waybill',
		icon: <PendingActionsIcon />,
	},
	{
		name: '財務表',
		path: 'finance',
		icon: <ReceiptLong />,
	},
	{
		name: '業績統計',
		path: 'statistics',
		icon: <TrendingUpIcon />,
	},
	{
		name: '使用者管理',
		path: 'user-management',
		icon: <PersonIcon />,
	},
];

const drawerWidth = 180;

const openedMixin = (theme: Theme): CSSObject => ({
	width: drawerWidth,
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen,
	}),
	overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	overflowX: 'hidden',
	width: `calc(${theme.spacing(8)} + 1px)`,
});

const DrawerHeader = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
	open?: boolean;
}

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
	zIndex: theme.zIndex.drawer + 1,
	backgroundImage: `linear-gradient(to top left,#0084e7,#003b68)`,
	// backgroundImage: `linear-gradient(to top left,${theme.palette.primary},#003b68)`,
	transition: theme.transitions.create(['width', 'margin'], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	...(open && {
		marginLeft: drawerWidth,
		width: `calc(100% - ${drawerWidth}px)`,
		transition: theme.transitions.create(['width', 'margin'], {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
	}),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
	width: drawerWidth,
	height: '100%',
	flexShrink: 0,
	whiteSpace: 'nowrap',
	boxSizing: 'border-box',
	borderRight: '1px solid rgba(0, 0, 0, 0.1)',
	zIndex: 999,
	...(open && {
		...openedMixin(theme),
		'& .MuiDrawer-paper': openedMixin(theme),
	}),
	...(!open && {
		...closedMixin(theme),
		'& .MuiDrawer-paper': closedMixin(theme),
	}),
}));

function NavigationAppBar() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, logout } = useAuth();
	const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

	const currentPath = location.pathname;

	const navigateToPage = (path: string) => {
		navigate(path);
	};

	const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setUserMenuAnchor(event.currentTarget);
	};

	const handleUserMenuClose = () => {
		setUserMenuAnchor(null);
	};

	const handleLogout = async () => {
		handleUserMenuClose();
		await logout();
		navigate('/login');
	};

	return (
		<Box sx={{ display: 'flex', backgroundColor: '#F9F9F9' }}>
			<AppBar position="fixed" id="navigation-app-bar">
				<Toolbar>
					<Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
						皓揚財務管理系統
					</Typography>

					{/* User Menu */}
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						{user && (
							<>
								<Chip
									label={user.role === 'Admin' ? '管理員' : '用戶'}
									size="small"
									color={user.role === 'Admin' ? 'secondary' : 'default'}
								/>
								<IconButton
									size="large"
									color="inherit"
									onClick={handleUserMenuOpen}
									sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
								>
									<AccountCircleIcon />
								</IconButton>
								<Menu
									anchorEl={userMenuAnchor}
									open={Boolean(userMenuAnchor)}
									onClose={handleUserMenuClose}
									anchorOrigin={{
										vertical: 'bottom',
										horizontal: 'right',
									}}
									transformOrigin={{
										vertical: 'top',
										horizontal: 'right',
									}}
								>
									<MenuItem disabled>
										<Box sx={{ textAlign: 'center' }}>
											<Typography variant="subtitle2">
												{user.fullName || user.username}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{user.email}
											</Typography>
										</Box>
									</MenuItem>
									<Divider />
									<MenuItem onClick={handleLogout}>
										<ListItemIcon>
											<LogoutIcon />
										</ListItemIcon>
										<ListItemText primary="登出" />
									</MenuItem>
								</Menu>
							</>
						)}
					</Box>
				</Toolbar>
			</AppBar>
			<Drawer
				id="navigation-app-bar-drawer"
				variant="permanent"
				sx={{
					width: drawerWidth,
					flexShrink: 0,
					[`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
				}}
			>
				<Toolbar />
				<Box sx={{ overflow: 'auto' }}>
					<List>
						{routeConfig.map((route) => {
							return (
								<ListItem key={route.name} disablePadding>
									<ListItemButton
										selected={currentPath.includes(route.path)}
										onClick={() => navigateToPage(route.path)}
									>
										<ListItemIcon>{route.icon}</ListItemIcon>
										<ListItemText primary={route.name} />
									</ListItemButton>
								</ListItem>
							);
						})}
					</List>
					<Divider />
					<List>
						<ListItem disablePadding>
							<ListItemButton onClick={() => navigateToPage('/settings')}>
								<ListItemIcon>
									<SettingsIcon />
								</ListItemIcon>
								<ListItemText primary="設定" />
							</ListItemButton>
						</ListItem>
					</List>
				</Box>
			</Drawer>
			<Box
				component="main"
				sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
			>
				<DrawerHeader id="drawerHeader" sx={{ height: '64px' }} />
				<Box
					sx={{
						display: 'flex',
						flex: '1 1 auto',
						p: 1,
						overflow: 'auto',
					}}
				>
					<Outlet />
				</Box>
			</Box>
		</Box>
	);
}

export default NavigationAppBar;
