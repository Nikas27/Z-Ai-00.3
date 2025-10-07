import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import SceneGenerator from './components/SceneGenerator';
import TabSelector from './components/TabSelector';
import UpgradeModal from './components/UpgradeModal';
import MyDesignsModal from './components/MyDesignsModal';
import { GeneratorMode } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider, useSubscriptionContext } from './contexts/SubscriptionContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/Toast';
import FreePlanIndicator from './components/FreePlanIndicator';
import ProPlanIndicator from './components/ProPlanIndicator';
import AdminDashboard from './components/AdminDashboard';
import { LiveUserProvider } from './contexts/LiveUserContext';
import { UserActivityProvider } from './contexts/UserActivityContext';
import ReferralManager from './components/ReferralManager';
import PurchaseHistoryModal from './components/PurchaseHistoryModal';
import Showcase from './components/Showcase';

const AppContent: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<GeneratorMode>(GeneratorMode.IMAGE);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isDesignsModalOpen, setDesignsModalOpen] = useState(false);
  const [isPurchaseHistoryModalOpen, setPurchaseHistoryModalOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [sourceImage, setSourceImage] = useState<{ base64: string; mime: string; dataUrl: string; } | null>(null);

  const { plan } = useSubscriptionContext();

  const handleUpgradeClick = () => setUpgradeModalOpen(true);
  const handleMyDesignsClick = () => setDesignsModalOpen(true);
  const handleViewPurchaseHistoryClick = () => setPurchaseHistoryModalOpen(true);
  
  const handleImageUpload = (imageData: { base64: string; mime: string; dataUrl: string } | null) => {
    setSourceImage(imageData);
  };
  
  const renderGenerator = () => {
    switch (selectedMode) {
      case GeneratorMode.IMAGE:
        return <ImageGenerator 
                  onUpgradeClick={handleUpgradeClick}
                  sourceImage={sourceImage}
                  onImageUpload={handleImageUpload}
                />;
      case GeneratorMode.VIDEO:
        return <VideoGenerator 
                  onUpgradeClick={handleUpgradeClick} 
                  sourceImage={sourceImage}
                  onImageUpload={handleImageUpload}
                />;
      case GeneratorMode.SCENE:
        // Render Scene Generator only for Pro users
        return plan === 'pro' ? <SceneGenerator /> : <ImageGenerator 
                  onUpgradeClick={handleUpgradeClick}
                  sourceImage={sourceImage}
                  onImageUpload={handleImageUpload}
                />;
      default:
        return <ImageGenerator 
                onUpgradeClick={handleUpgradeClick}
                sourceImage={sourceImage}
                onImageUpload={handleImageUpload}
              />;
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Header 
        onUpgradeClick={handleUpgradeClick} 
        onViewDesignsClick={handleMyDesignsClick} 
        onViewPurchaseHistoryClick={handleViewPurchaseHistoryClick}
        view={view} 
        setView={setView} 
      />
      <main className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
        {view === 'user' ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <TabSelector selectedMode={selectedMode} onSelectMode={setSelectedMode} />
            {renderGenerator()}
            <Showcase />
            {plan === 'free' ? (
                <FreePlanIndicator onUpgradeClick={handleUpgradeClick} />
            ) : (
                <ProPlanIndicator onViewDesignsClick={handleMyDesignsClick} />
            )}
            <ReferralManager />
          </div>
        ) : (
          <AdminDashboard />
        )}
      </main>
      <Footer isMapOpen={isMapOpen} setIsMapOpen={setIsMapOpen} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      <MyDesignsModal isOpen={isDesignsModalOpen} onClose={() => setDesignsModalOpen(false)} />
      <PurchaseHistoryModal isOpen={isPurchaseHistoryModalOpen} onClose={() => setPurchaseHistoryModalOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SubscriptionProvider>
          <LiveUserProvider>
            <UserActivityProvider>
              <AppContent />
              <ToastContainer />
            </UserActivityProvider>
          </LiveUserProvider>
        </SubscriptionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;