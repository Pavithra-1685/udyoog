import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, GraduationCap, MapPin, 
  Github, Linkedin, ExternalLink, Plus, Trash2, 
  Star, Sparkles, Loader2, Save, BookOpen
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

interface StudentProfileFormProps {
  initialData?: any;
  onSave?: () => void;
}

const GRADUATION_OPTIONS = ['B.Tech', 'BCA', 'BBA', 'B.Sc', 'M.Tech'];
const BRANCH_OPTIONS = ['AI & ML', 'AI & DS', 'CSE General', 'Cybersecurity', 'ECE'];
const BATCH_OPTIONS = ['R-22', 'R-23', 'R-24', 'R-25', 'R-26', 'R-27', 'R-28', 'R-29', 'R-30'];
const LOCATION_OPTIONS = ['Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi NCR', 'Remote'];

export default function StudentProfileForm({ initialData, onSave }: StudentProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    graduation: initialData?.graduation || '',
    branch: initialData?.branch || '',
    other_branch: '',
    registration_no: initialData?.registration_no || '',
    home_location: initialData?.home_location || '',
    preferred_locations: initialData?.preferred_locations || [],
    github_url: initialData?.github_url || '',
    leetcode_url: initialData?.leetcode_url || '',
    codechef_url: initialData?.codechef_url || '',
    linkedin_url: initialData?.linkedin_url || '',
    batch: initialData?.batch || '',
    projects: initialData?.projects || [],
    avatar_url: initialData?.avatar_url || '',
    skills: (initialData?.skills as Skill[]) || [],
    semester_cgpa: initialData?.semester_cgpa || {},
    cgpa: initialData?.cgpa || ''
  });

  const [newProject, setNewProject] = useState({ name: '', description: '', tech: '' });
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Beginner');
  const [newLocation, setNewLocation] = useState('');
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);

  // Auto-calculate CGPA whenever semester scores change
  useEffect(() => {
    const rawSems = formData.semester_cgpa;
    const sems = Object.values(typeof rawSems === 'object' && rawSems !== null ? rawSems : {})
      .filter(v => v != null && v !== '' && !isNaN(parseFloat(v.toString())));
      
    if (sems.length > 0) {
      const sum = sems.reduce((acc: number, curr: any) => acc + parseFloat(curr.toString()), 0);
      const avg = (sum / sems.length).toFixed(2);
      if (formData.cgpa !== avg) {
        setFormData(prev => ({ ...prev, cgpa: avg }));
      }
    } else if (formData.cgpa !== '0.00' && formData.cgpa !== '') {
      setFormData(prev => ({ ...prev, cgpa: '0.00' }));
    }
  }, [formData.semester_cgpa]);

  const handleLocationToggle = (loc: string) => {
    const currentLocs = formData.preferred_locations || [];
    const isSelected = currentLocs.includes(loc);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        preferred_locations: Array.isArray(prev.preferred_locations) 
          ? prev.preferred_locations.filter(l => l !== loc)
          : []
      }));
    } else {
      if (currentLocs.length >= 4) {
        toast.error('Limit reached (Max 4).');
        return;
      }
      setFormData(prev => ({
        ...prev,
        preferred_locations: [...(prev.preferred_locations || []), loc]
      }));
    }
  };

  const addCustomLocation = () => {
    if (!newLocation.trim()) return;
    const trimmed = newLocation.trim();
    const currentLocs = formData.preferred_locations || [];
    if (currentLocs.includes(trimmed)) return;
    if (currentLocs.length >= 4) {
      toast.error('Limit reached.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      preferred_locations: [...(prev.preferred_locations || []), trimmed]
    }));
    setNewLocation('');
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (formData.skills.some(s => s.name.toLowerCase() === newSkill.toLowerCase())) return;
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: newSkill, level: newSkillLevel }]
    }));
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    if (!newProject.name.trim() || !newProject.description.trim()) {
      toast.error('Project name and description are required.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        name: newProject.name,
        description: newProject.description,
        tech: newProject.tech.split(',').map(t => t.trim()).filter(t => t)
      }]
    }));
    setNewProject({ name: '', description: '', tech: '' });
  };

  const removeProject = (index: number) => {
      setFormData(prev => ({
        ...prev,
        projects: Array.isArray(prev.projects) 
          ? prev.projects.filter((_, i) => i !== index)
          : []
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if ((formData.graduation === 'B.Tech' || formData.graduation === 'M.Tech') && !formData.github_url) {
        throw new Error('GitHub profile is mandatory for B.Tech/M.Tech students.');
      }
      if (!formData.linkedin_url) {
        throw new Error('LinkedIn profile is mandatory for all students.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          registration_no: formData.registration_no,
          graduation: formData.graduation,
          branch: formData.branch === 'Other' ? formData.other_branch : formData.branch,
          home_location: formData.home_location,
          preferred_locations: formData.preferred_locations,
          github_url: formData.github_url,
          leetcode_url: formData.leetcode_url,
          codechef_url: formData.codechef_url,
          linkedin_url: formData.linkedin_url,
          batch: formData.batch,
          projects: formData.projects,
          skills: formData.skills,
          semester_cgpa: formData.semester_cgpa,
          cgpa: formData.cgpa ? parseFloat(formData.cgpa.toString()) : null
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile saved!');
      if (onSave) onSave();
    } catch (error: any) {
      toast.error(error.message || 'Save failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestSkills = async () => {
    setIsSuggestingSkills(true);
    setTimeout(() => {
      const suggestions = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'];
      const random = suggestions[Math.floor(Math.random() * suggestions.length)];
      setNewSkill(random);
      setIsSuggestingSkills(false);
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#142361' }}>
          <User className="w-5 h-5" /> Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">Registration No</label>
            <input
              type="text"
              required
              value={formData.registration_no}
              onChange={e => setFormData({ ...formData, registration_no: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
              placeholder="e.g. 2111001"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">Home Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={formData.home_location}
                onChange={e => setFormData({ ...formData, home_location: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                placeholder="City, State"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#142361' }}>
          <GraduationCap className="w-5 h-5" /> Academic
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Degree</label>
            <select
              required
              value={formData.graduation}
              onChange={e => setFormData({ ...formData, graduation: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50 appearance-none cursor-pointer"
            >
              <option value="">Select</option>
              {GRADUATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Branch</label>
            <select
              value={BRANCH_OPTIONS.includes(formData.branch) ? formData.branch : formData.branch ? 'Other' : ''}
              onChange={e => {
                const val = e.target.value;
                if (val === 'Other') {
                   setFormData({ ...formData, branch: 'Other' });
                } else {
                   setFormData({ ...formData, branch: val });
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50 appearance-none cursor-pointer"
            >
              <option value="">Select</option>
              {BRANCH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          {formData.branch === 'Other' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Specify Branch</label>
              <input
                type="text"
                required
                value={formData.other_branch}
                onChange={e => setFormData({ ...formData, other_branch: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
                placeholder="Enter your branch"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Batch</label>
            <select
              value={formData.batch}
              onChange={e => setFormData({ ...formData, batch: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50 appearance-none cursor-pointer"
            >
              <option value="">Select</option>
              {BATCH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#142361' }}>
          <GraduationCap className="w-5 h-5" /> Academic Performance
        </h3>
        <div className="bg-[#142361]/5 p-6 rounded-2xl border border-[#142361]/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#142361]">Overall CGPA (Auto-calculated)</label>
              <div className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-100 text-[#142361] font-bold text-lg">
                {formData.cgpa || '0.00'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <div key={sem} className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Sem {sem}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.semester_cgpa?.[`sem${sem}`] || ''}
                  onChange={e => setFormData({
                    ...formData,
                    semester_cgpa: {
                      ...formData.semester_cgpa,
                      [`sem${sem}`]: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#e0653b] bg-white text-sm"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#142361' }}>
          <MapPin className="w-5 h-5" /> Preferences
        </h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Home</label>
            <input
              type="text"
              required
              value={formData.home_location}
              onChange={e => setFormData({ ...formData, home_location: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {LOCATION_OPTIONS.map(loc => (
              <button
                type="button"
                key={loc}
                onClick={() => handleLocationToggle(loc)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  (formData.preferred_locations || []).includes(loc)
                    ? 'bg-[#142361] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {loc}
              </button>
            ))}
            {(Array.isArray(formData.preferred_locations) ? formData.preferred_locations : [])
              .filter(l => !LOCATION_OPTIONS.includes(l))
              .map(loc => (
              <button
                type="button"
                key={loc}
                onClick={() => handleLocationToggle(loc)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-[#142361] text-white flex items-center gap-1"
              >
                {loc} <Trash2 className="w-3 h-3 ml-1 opacity-70" />
              </button>
            ))}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Other location"
                className="px-3 py-1.5 text-sm rounded-full border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white w-32"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomLocation())}
              />
              <button
                type="button"
                onClick={addCustomLocation}
                className="px-2 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#142361' }}>
          <ExternalLink className="w-5 h-5" /> Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Github className="w-4 h-4" /> GitHub 
              {(formData.graduation === 'B.Tech' || formData.graduation === 'M.Tech') && <span className="text-[#e0653b] text-xs">*</span>}
            </label>
            <input
              type="url"
              value={formData.github_url}
              onChange={e => setFormData({ ...formData, github_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Linkedin className="w-4 h-4" /> LinkedIn <span className="text-[#e0653b] text-xs">*</span>
            </label>
            <input
              type="url"
              required
              value={formData.linkedin_url}
              onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> LeetCode (Optional)
            </label>
            <input
              type="url"
              value={formData.leetcode_url}
              onChange={e => setFormData({ ...formData, leetcode_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> CodeChef (Optional)
            </label>
            <input
              type="url"
              value={formData.codechef_url}
              onChange={e => setFormData({ ...formData, codechef_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white/50"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#142361' }}>
          <BookOpen className="w-5 h-5" /> Projects & Experience
        </h3>
        
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Project Title"
              value={newProject.name}
              onChange={e => setNewProject({...newProject, name: e.target.value})}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white"
            />
            <input
              type="text"
              placeholder="Tech Stack (comma separated)"
              value={newProject.tech}
              onChange={e => setNewProject({...newProject, tech: e.target.value})}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white"
            />
            <textarea
              placeholder="Project Description..."
              value={newProject.description}
              onChange={e => setNewProject({...newProject, description: e.target.value})}
              rows={2}
              className="md:col-span-2 px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e0653b] bg-white resize-none"
            />
          </div>
          <button
            type="button"
            onClick={addProject}
            className="px-4 py-2 bg-[#142361] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>

          <div className="space-y-3 mt-4">
            {formData.projects.map((project: any, index: number) => (
              <div key={index} className="relative p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <button
                  type="button"
                  onClick={() => removeProject(index)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <h4 className="font-bold text-[#142361]">{project.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {project.tech?.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#142361' }}>
            <Star className="w-5 h-5" /> Skills
          </h3>
          <button
            type="button"
            onClick={suggestSkills}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e0653b]"
          >
            <Sparkles className="w-3 h-3" /> AI
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Skill"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-300"
            />
            <select
              value={newSkillLevel}
              onChange={e => setNewSkillLevel(e.target.value as any)}
              className="px-4 py-2 rounded-xl border border-gray-300 appearance-none cursor-pointer"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2 bg-[#142361] text-white rounded-xl"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <div
                key={skill.name}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
              >
                <span className="text-sm font-medium">{skill.name}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-[#e0653b]/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: '#e0653b' }}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Save className="w-6 h-6" />
              Save
            </>
          )}
        </button>
      </div>
    </form>
  );
}
