
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Calendar, MapPin, TrendingUp, AlertTriangle, Users, MessageCircle, Bell, Menu, Leaf, Droplets, Bug, Sun, Calendar as CalendarIcon, DollarSign, Shield, Activity } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  PartnerDashboardData, 
  CommunityEvent, 
  RiskAlert, 
  LoginUserInput,
  RegisterUserInput,
  UserRole 
} from '../../server/src/schema';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role: UserRole } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [loginForm, setLoginForm] = useState<LoginUserInput>({
    email: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState<RegisterUserInput>({
    email: '',
    phone: '',
    password: '',
    full_name: '',
    role: 'partner'
  });

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const [dashboard, events, alerts] = await Promise.all([
        trpc.getPartnerDashboard.query({ partnerId: currentUser.id }),
        trpc.getCommunityEvents.query(),
        trpc.getRiskAlerts.query({})
      ]);
      
      setDashboardData(dashboard);
      setCommunityEvents(events);
      setRiskAlerts(alerts);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadDashboardData();
    }
  }, [isAuthenticated, currentUser, loadDashboardData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.loginUser.mutate(loginForm);
      // Assuming login returns user data
      setCurrentUser({ 
        id: 1, // This would come from the response
        name: registerForm.full_name || 'Partner User',
        role: 'partner' 
      });
      setIsAuthenticated(true);
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.registerUser.mutate(registerForm);
      alert('Registration successful! Please login with your credentials.');
      setAuthMode('login');
      setRegisterForm({
        email: '',
        phone: '',
        password: '',
        full_name: '',
        role: 'partner'
      });
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setDashboardData(null);
    setCommunityEvents([]);
    setRiskAlerts([]);
  };

  // Format currency in Indonesian Rupiah
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">BUMR AgriPartner</CardTitle>
            <CardDescription>Platform Kemitraan Pertanian Digital</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={loginForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLoginForm((prev: LoginUserInput) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={loginForm.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLoginForm((prev: LoginUserInput) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? 'Memproses...' : 'Masuk'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Lengkap</label>
                    <Input
                      value={registerForm.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRegisterForm((prev: RegisterUserInput) => ({ ...prev, full_name: e.target.value }))
                      }
                      placeholder="Nama lengkap Anda"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={registerForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRegisterForm((prev: RegisterUserInput) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nomor Telepon</label>
                    <Input
                      type="tel"
                      value={registerForm.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRegisterForm((prev: RegisterUserInput) => ({ 
                          ...prev, 
                          phone: e.target.value || undefined 
                        }))
                      }
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={registerForm.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRegisterForm((prev: RegisterUserInput) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Minimal 8 karakter"
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? 'Memproses...' : 'Daftar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Dashboard UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">BUMR AgriPartner</h1>
                  <p className="text-sm text-gray-500">Selamat datang, {currentUser?.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      Navigasi aplikasi AgriPartner
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <Button variant="ghost" className="justify-start">
                      <Activity className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      <MapPin className="w-4 h-4 mr-2" />
                      Peta Lahan
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Laporan Keuangan
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Komunitas
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat Support
                    </Button>
                    <Separator />
                    <Button variant="ghost" onClick={handleLogout} className="justify-start text-red-600">
                      Keluar
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Partnership Overview */}
            {dashboardData?.partnership && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Leaf className="w-5 h-5 mr-2 text-green-600" />
                      Status Kemitraan
                    </CardTitle>
                    <CardDescription>
                      Periode: {dashboardData.partnership.start_date.toLocaleDateString('id-ID')} - {dashboardData.partnership.end_date.toLocaleDateString('id-ID')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Investasi</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(dashboardData.partnership.investment_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Estimasi Return</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(dashboardData.partnership.estimated_return)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Progress Saat Ini</span>
                          <span className="text-sm font-medium">{dashboardData.partnership.current_progress}%</span>
                        </div>
                        <Progress value={dashboardData.partnership.current_progress} className="h-3" />
                        <p className="text-sm text-gray-600">
                          Fase: <span className="capitalize font-medium">{dashboardData.partnership.current_phase}</span>
                        </p>
                      </div>
                      
                      <Badge 
                        variant={dashboardData.partnership.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {dashboardData.partnership.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                      Ringkasan Keuangan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Pengeluaran</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(dashboardData.financial_summary.total_expenses)}
                        </p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Breakdown Biaya:</p>
                        {Object.entries(dashboardData.financial_summary.expense_breakdown).map(([type, amount]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                            <span>{formatCurrency(amount as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Risk Alerts */}
            {riskAlerts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
                  Peringatan Risiko
                </h2>
                <div className="grid gap-4">
                  {riskAlerts.map((alert: RiskAlert) => (
                    <Alert key={alert.id} className="border-l-4 border-l-amber-500">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        {alert.title}
                        <Badge variant="outline" className="ml-2">
                          Level {alert.severity_level}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mt-2">{alert.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {alert.alert_date.toLocaleDateString('id-ID')} • {alert.risk_type}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs for different sections */}
            <Tabs defaultValue="activities" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="activities">Aktivitas Lahan</TabsTrigger>
                <TabsTrigger value="community">Komunitas</TabsTrigger>
                <TabsTrigger value="insurance">Asuransi</TabsTrigger>
                <TabsTrigger value="reports">Laporan</TabsTrigger>
              </TabsList>

              <TabsContent value="activities" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-green-600" />
                      Aktivitas Terbaru
                    </CardTitle>
                    <CardDescription>
                      Kegiatan pertanian yang dilakukan di lahan kemitraan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.recent_activities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Belum ada aktivitas yang tercatat</p>
                          <p className="text-sm">Aktivitas akan muncul setelah petani melakukan update</p>
                        </div>
                      ) : (
                        dashboardData?.recent_activities.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              {activity.activity_type === 'planting' && <Leaf className="w-5 h-5 text-green-600" />}
                              {activity.activity_type === 'watering' && <Droplets className="w-5 h-5 text-blue-600" />}
                              {activity.activity_type === 'pest_control' && <Bug className="w-5 h-5 text-red-600" />}
                              {activity.activity_type === 'fertilizing' && <Sun className="w-5 h-5 text-yellow-600" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium capitalize">{activity.activity_type.replace('_', ' ')}</h3>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {activity.activity_date.toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="community" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      Acara Komunitas
                    </CardTitle>
                    <CardDescription>
                      Kunjungan lahan dan acara komunitas mendatang
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {communityEvents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Belum ada acara yang dijadwalkan</p>
                          <p className="text-sm">Acara komunitas akan muncul di sini</p>
                        </div>
                      ) : (
                        communityEvents.map((event: CommunityEvent) => (
                          <div key={event.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{event.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                    {event.event_date.toLocaleDateString('id-ID')}
                                  </span>
                                  <span className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {event.location}
                                  </span>
                                  <span className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    {event.current_participants}/{event.max_participants || '∞'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-green-600">
                                  {formatCurrency(event.fee)}
                                </p>
                                <Badge variant="outline" className="capitalize mt-2">
                                  {event.event_type.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insurance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-blue-600" />
                      Asuransi & Perlindungan
                    </CardTitle>
                    <CardDescription>
                      Status asuransi lahan dan cakupan risiko
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Informasi asuransi belum tersedia</p>
                      <p className="text-sm">Hubungi tim manajemen untuk informasi lebih lanjut</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      Laporan & Analisis
                    </CardTitle>
                    <CardDescription>
                      Grafik performa dan proyeksi hasil panen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Laporan detail sedang dipersiapkan</p>
                      <p className="text-sm">Grafik dan analisis akan tersedia setelah data terkumpul</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
                <CardDescription>
                  Fitur yang sering digunakan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Button variant="outline" className="flex flex-col items-center py-6 h-auto">
                    <MessageCircle className="w-6 h-6 mb-2" />
                    <span className="text-sm">Chat Support</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center py-6 h-auto">
                    <MapPin className="w-6 h-6 mb-2" />
                    <span className="text-sm">Lihat Peta</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center py-6 h-auto">
                    <Calendar className="w-6 h-6 mb-2" />
                    <span className="text-sm">Jadwal Kunjungan</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center py-6 h-auto">
                    <TrendingUp className="w-6 h-6 mb-2" />
                    <span className="text-sm">Laporan Lengkap</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
