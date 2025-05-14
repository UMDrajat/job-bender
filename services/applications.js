import supabase from '../supabase-config.js';

class ApplicationsService {
    async recordApplication(application) {
        try {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const { data, error } = await supabase
                .from('applications')
                .insert({
                    user_id: user.id,
                    company_name: application.companyName,
                    position: application.position,
                    job_url: application.jobUrl,
                    status: application.status || 'applied',
                    notes: application.notes,
                    salary_range: application.salaryRange,
                    location: application.location,
                    job_type: application.jobType,
                    interview_date: application.interviewDate,
                    interview_type: application.interviewType,
                    follow_up_date: application.followUpDate,
                    contact_name: application.contactName,
                    contact_email: application.contactEmail,
                    contact_phone: application.contactPhone
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error recording application:', error);
            throw error;
        }
    }

    async getApplications(filters = {}) {
        try {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            let query = supabase
                .from('applications')
                .select('*')
                .eq('user_id', user.id)
                .order('application_date', { ascending: false });

            // Apply filters
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }
            if (filters.startDate) {
                query = query.gte('application_date', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('application_date', filters.endDate);
            }
            if (filters.company) {
                query = query.ilike('company_name', `%${filters.company}%`);
            }
            if (filters.jobType) {
                query = query.eq('job_type', filters.jobType);
            }
            if (filters.location) {
                query = query.ilike('location', `%${filters.location}%`);
            }
            if (filters.hasInterview) {
                query = query.not('interview_date', 'is', null);
            }
            if (filters.needsFollowUp) {
                query = query.not('follow_up_date', 'is', null)
                    .lte('follow_up_date', new Date().toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting applications:', error);
            throw error;
        }
    }

    async updateApplication(id, updates) {
        try {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const { data, error } = await supabase
                .from('applications')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating application:', error);
            throw error;
        }
    }

    async deleteApplication(id) {
        try {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const { error } = await supabase
                .from('applications')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting application:', error);
            throw error;
        }
    }

    async getApplicationStats() {
        try {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const { data, error } = await supabase
                .from('applications')
                .select('status')
                .eq('user_id', user.id);

            if (error) throw error;

            const stats = {
                total: data.length,
                byStatus: {},
                byJobType: {},
                byLocation: {},
                interviewRate: 0,
                offerRate: 0
            };

            data.forEach(app => {
                // Count by status
                stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1;
                
                // Count by job type
                if (app.job_type) {
                    stats.byJobType[app.job_type] = (stats.byJobType[app.job_type] || 0) + 1;
                }
                
                // Count by location
                if (app.location) {
                    stats.byLocation[app.location] = (stats.byLocation[app.location] || 0) + 1;
                }
            });

            // Calculate rates
            const interviews = stats.byStatus['interview'] || 0;
            const offers = stats.byStatus['offered'] || 0;
            stats.interviewRate = stats.total ? (interviews / stats.total) * 100 : 0;
            stats.offerRate = stats.total ? (offers / stats.total) * 100 : 0;

            return stats;
        } catch (error) {
            console.error('Error getting application stats:', error);
            throw error;
        }
    }

    async getUpcomingInterviews() {
        try {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .eq('user_id', user.id)
                .not('interview_date', 'is', null)
                .gte('interview_date', new Date().toISOString())
                .order('interview_date', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting upcoming interviews:', error);
            throw error;
        }
    }

    async getFollowUpsNeeded() {
        try {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .eq('user_id', user.id)
                .not('follow_up_date', 'is', null)
                .lte('follow_up_date', new Date().toISOString())
                .order('follow_up_date', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting follow-ups needed:', error);
            throw error;
        }
    }
}

export default ApplicationsService; 