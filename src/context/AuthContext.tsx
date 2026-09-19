import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole, AccountStatus, TraineeDetails, TrainerDetails } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  status: AccountStatus | null;
  traineeDetails: TraineeDetails | null;
  trainerDetails: TrainerDetails | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  sendOtp: (identifier: string) => Promise<{ message: string; masked_destination: string; demo_code?: string; expires_in_seconds: number; target_user_name?: string; role?: string }>;
  otpLogin: (identifier: string, code: string) => Promise<UserProfile>;
  register: (data: any) => Promise<{ status: AccountStatus; message?: string }>;
  demoLogin: (role: 'trainee' | 'trainer' | 'admin') => Promise<UserProfile>;
  faceLogin: (vector: number[], livenessScore: number, email?: string) => Promise<{ user: UserProfile; similarity: number }>;
  linkFace: (email: string, vector: number[], livenessScore: number, password?: string) => Promise<{ user: UserProfile; similarity: number }>;
  enrollFace: (vector: number[], livenessScore: number) => Promise<void>;
  setSession: (session: { token: string; user: UserProfile; trainee_details?: TraineeDetails; trainer_details?: TrainerDetails }) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserSession: (updatedUser: UserProfile, trainee?: TraineeDetails, trainer?: TrainerDetails) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cc_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [traineeDetails, setTraineeDetails] = useState<TraineeDetails | null>(null);
  const [trainerDetails, setTrainerDetails] = useState<TrainerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const USER_KEY = 'cc_user_profile';
  const TRAINEE_KEY = 'cc_trainee_details';
  const TRAINER_KEY = 'cc_trainer_details';

  const setAuthSession = (newToken: string, newUser: UserProfile, trainee?: TraineeDetails, trainer?: TrainerDetails) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    if (trainee) {
      localStorage.setItem(TRAINEE_KEY, JSON.stringify(trainee));
      setTraineeDetails(trainee);
    }
    if (trainer) {
      localStorage.setItem(TRAINER_KEY, JSON.stringify(trainer));
      setTrainerDetails(trainer);
    }
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TRAINEE_KEY);
    localStorage.removeItem(TRAINER_KEY);
    setToken(null);
    setUser(null);
    setTraineeDetails(null);
    setTrainerDetails(null);
  };

  const updateUserSession = (updatedUser: UserProfile, trainee?: TraineeDetails, trainer?: TrainerDetails) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    if (trainee !== undefined) {
      if (trainee) localStorage.setItem(TRAINEE_KEY, JSON.stringify(trainee));
      setTraineeDetails(trainee);
    }
    if (trainer !== undefined) {
      if (trainer) localStorage.setItem(TRAINER_KEY, JSON.stringify(trainer));
      setTrainerDetails(trainer);
    }
  };

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      if (data.trainee_details) setTraineeDetails(data.trainee_details);
      if (data.trainer_details) setTrainerDetails(data.trainer_details);
    } catch (err: any) {
      console.warn('Live session check encountered an error:', err);
      // Fall back to stored local profile if available (supports offline and static deployments)
      const cachedUser = localStorage.getItem(USER_KEY);
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          const cachedTrainee = localStorage.getItem(TRAINEE_KEY);
          if (cachedTrainee) setTraineeDetails(JSON.parse(cachedTrainee));
          const cachedTrainer = localStorage.getItem(TRAINER_KEY);
          if (cachedTrainer) setTrainerDetails(JSON.parse(cachedTrainer));
        } catch {
          clearSession();
        }
      } else {
        clearSession();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await api.login(email, password);
    setAuthSession(res.token, res.user, res.trainee_details, res.trainer_details);
    return res.user;
  };

  const sendOtp = async (identifier: string) => {
    return await api.sendOtp(identifier);
  };

  const otpLogin = async (identifier: string, code: string): Promise<UserProfile> => {
    const res = await api.verifyOtp(identifier, code);
    setAuthSession(res.token, res.user, res.trainee_details, res.trainer_details);
    return res.user;
  };

  const register = async (formData: any): Promise<{ status: AccountStatus; message?: string }> => {
    const res = await api.register(formData);
    const userStatus: AccountStatus = res.pending ? 'pending' : (res.user?.status || 'active');
    if (!res.pending && res.token && res.user) {
      setAuthSession(res.token, res.user, res.trainee_details, res.trainer_details);
    }
    return {
      status: userStatus,
      message: res.message
    };
  };

  const demoLogin = async (role: 'trainee' | 'trainer' | 'admin'): Promise<UserProfile> => {
    const res = await api.demoLogin(role);
    setAuthSession(res.token, res.user, res.trainee_details, res.trainer_details);
    return res.user;
  };

  const faceLogin = async (vector: number[], livenessScore: number, email?: string) => {
    const res = await api.faceLogin(vector, livenessScore, email);
    setAuthSession(res.token, res.user, res.trainee_details, res.trainer_details);
    return { user: res.user, similarity: res.similarity };
  };

  const linkFace = async (email: string, vector: number[], livenessScore: number, password?: string) => {
    const res = await api.linkFace(email, vector, livenessScore, password);
    setAuthSession(res.token, res.user, res.trainee_details, res.trainer_details);
    return { user: res.user, similarity: res.similarity };
  };

  const enrollFace = async (vector: number[], livenessScore: number) => {
    const res = await api.faceEnroll(vector, livenessScore);
    setUser(res.user);
  };

  const setSession = (session: { token: string; user: UserProfile; trainee_details?: TraineeDetails; trainer_details?: TrainerDetails }) => {
    setAuthSession(session.token, session.user, session.trainee_details, session.trainer_details);
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        status: user?.status || null,
        traineeDetails,
        trainerDetails,
        isLoading,
        login,
        sendOtp,
        otpLogin,
        register,
        demoLogin,
        faceLogin,
        linkFace,
        enrollFace,
        setSession,
        logout,
        refreshUser,
        updateUserSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
