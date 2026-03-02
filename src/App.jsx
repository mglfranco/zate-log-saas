import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CalculatorLayout from './layouts/CalculatorLayout';
import AdminLayout from './layouts/AdminLayout';
import CalculatorPage from './pages/ClientCalculator';
import AdminDashboard from './pages/AdminDashboard';
import AdminTabelas from './pages/AdminTabelas';
import AdminOcupacao from './pages/AdminOcupacao';
import AdminTracking from './pages/AdminTracking';
import AdminCanhotos from './pages/AdminCanhotos';
import DriverApp from './pages/DriverApp';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Client Facing / Lead Gen */}
                <Route path="/" element={<CalculatorLayout />}>
                    <Route index element={<CalculatorPage />} />
                </Route>

                {/* Backoffice Admin */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="tabelas" element={<AdminTabelas />} />
                    <Route path="ocupacao" element={<AdminOcupacao />} />
                    <Route path="tracking" element={<AdminTracking />} />
                    <Route path="canhotos" element={<AdminCanhotos />} />
                </Route>

                {/* Driver App */}
                <Route path="/driver" element={<DriverApp />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
