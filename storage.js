import supabase from './supabase-config.js';

class StorageService {
    constructor() {
        this.storageType = 'local'; // 'local' or 'supabase'
        this.initializeStorage();
    }

    async initializeStorage() {
        // Check if user has chosen storage type
        const { storageType } = await chrome.storage.local.get('storageType');
        if (storageType) {
            this.storageType = storageType;
        }
    }

    async setStorageType(type) {
        this.storageType = type;
        await chrome.storage.local.set({ storageType: type });
    }

    async saveData(data) {
        if (this.storageType === 'supabase') {
            return this.saveToSupabase(data);
        } else {
            return this.saveToLocal(data);
        }
    }

    async loadData() {
        if (this.storageType === 'supabase') {
            return this.loadFromSupabase();
        } else {
            return this.loadFromLocal();
        }
    }

    async saveToLocal(data) {
        try {
            await chrome.storage.local.set({ userData: data });
            return true;
        } catch (error) {
            console.error('Error saving to local storage:', error);
            return false;
        }
    }

    async loadFromLocal() {
        try {
            const { userData } = await chrome.storage.local.get('userData');
            return userData || null;
        } catch (error) {
            console.error('Error loading from local storage:', error);
            return null;
        }
    }

    async saveToSupabase(data) {
        try {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const { error } = await supabase
                .from('user_data')
                .upsert({
                    user_id: user.id,
                    data: data,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            return false;
        }
    }

    async loadFromSupabase() {
        try {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const { data, error } = await supabase
                .from('user_data')
                .select('data')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return data?.data || null;
        } catch (error) {
            console.error('Error loading from Supabase:', error);
            return null;
        }
    }

    async signIn() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: chrome.identity.getRedirectURL()
                }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error signing out:', error);
            return false;
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
}

// Create and export a singleton instance
const storageService = new StorageService();
export default storageService; 