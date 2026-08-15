// Centralized data store for the Udyoog Landing Page
// This avoids hardcoding copy in the JSX files.

export const navbarData = {
  brandName: 'UDYOOG',
  menuItems: [
    { label: 'Home', id: 'home' },
    { label: 'About', id: 'about' },
    { label: 'Opportunities', id: 'pathways' },
    { label: 'Placement Lifecycle', id: 'how-it-works' },
  ],
  getStartedLabel: 'Get Started'
};

export const heroData = {
  badge: 'NARAATRAL’s University & Udyoog Ecosystem',
  heading: {
    part1: 'Education to',
    part2: 'Opportunity.',
    part3: 'Opportunity to',
    part4: 'Outcomes.'
  },
  description: 'Udyoog is a unified university and professional ecosystem designed to connect institutions, students, employers, and opportunities in one platform.',
  exploreBtnLabel: 'Explore Ecosystem',
  getStartedBtnLabel: 'Get Started',
  featureCards: [
    {
      title: 'Universities',
      desc: 'Centralized environment for placement management, eligibility, and analytics.'
    },
    {
      title: 'Students',
      desc: 'Personal opportunity discovery layer and Udyoog pipeline tracker.'
    },
    {
      title: 'Employers',
      desc: 'Direct portal to list roles, filter criteria, and recruit validated talent.'
    }
  ]
};

export const aboutData = {
  badge: 'About Udyoog',
  heading: 'Connecting the Udyoog Journey',
  desc1: 'Udyoog brings the entire placement and Udyoog journey into one connected system—from a university managing recruitment drives to a student tracking an internship until the final outcome.',
  desc2: 'Today, placement and Udyoog workflows are fragmented across spreadsheets, forms, emails, messaging groups, and manual eligibility checks. Udyoog brings these workflows together, resolving confusion about eligibility, application status, and upcoming rounds.',

  steps: [
    { label: 'Centralize Workflow', desc: 'Replace scattered spreadsheets, forms, and email threads.' },
    { label: 'Automate Eligibility', desc: 'Perform instant checks against company-specified criteria.' },
    { label: 'Track the Outcome', desc: 'Know exactly where every candidate stands in the pipeline.' }
  ]
};

export const pathwaysData = {
  badge: 'Opportunity Discovery Layer',
  heading: 'All Opportunities, One Workspace',
  subheading: 'Udyoog aggregates multiple opportunity channels to ensure students never miss an opening.',
  exploreLabel: 'Explore Type',
  roles: [
    {
      title: 'Internships',
      desc: 'Gain real-world professional experience through structured summer and semester internships.',
      skills: ['Summer Internships', 'Spring/Fall Co-Ops', 'Project Internships']
    },
    {
      title: 'Full-Time Jobs',
      desc: 'Discover post-graduation roles and campus placement opportunities from top hiring partners.',
      skills: ['Campus Placements', 'Off-Campus Drives', 'Graduate Roles']
    },
    {
      title: 'Research Internships',
      desc: 'Collaborate directly with professors, academic labs, and research institutions.',
      skills: ['Academic Research', 'Lab Projects', 'Publications']
    },
    {
      title: 'Hackathons & Competitions',
      desc: 'Solve real-world challenges, build working prototypes, and win sponsor prizes.',
      skills: ['Code Challenges', 'Project Showcases', 'Ideathons']
    },
    {
      title: 'Fellowships & Scholarships',
      desc: 'Apply for specialized learning grants, academic funding, and industry mentorship.',
      skills: ['Mentorship Programs', 'Grants', 'Community Programs']
    },
    {
      title: 'Graduate Opportunities',
      desc: 'Access apprenticeships, management trainee positions, and rotational programs.',
      skills: ['Management Trainee', 'Apprenticeships', 'Rotational Schemes']
    }
  ]
};

export const howItWorksData = {
  badge: 'Placement Management Lifecycle',
  heading: 'The Complete Placement Flow',
  subheading: 'A structured, automated pipeline that guides universities and companies from job creation to final placement.',
  steps: [
    {
      num: '01',
      title: 'Job / Drive Creation',
      desc: 'Employers create recruitment drives and specify role requirements.'
    },
    {
      num: '02',
      title: 'Automated Eligibility Check',
      desc: 'Udyoog automatically filters students who meet the target criteria.'
    },
    {
      num: '03',
      title: 'Registration & Applications',
      desc: 'Eligible students apply directly, instantly logging into the dashboard.'
    },
    {
      num: '04',
      title: 'Shortlisting & Assessments',
      desc: 'Manage candidate shortlists, online coding tests, and assignments.'
    },
    {
      num: '05',
      title: 'Interviews & Offer Selected',
      desc: 'Coordinate interview schedules and capture final placement outcomes.'
    }
  ]
};

export const userRolesData = {
  badge: 'Ecosystem Bridge',
  heading: 'University ↔ Student ↔ Employer',
  subheading: 'A collaborative workspace designed for all three critical pillars of Udyoog outcomes.',
  roles: [
    {
      title: 'UNIVERSITY',
      tagline: 'Placement Team Control',
      desc: 'Manage student profiles, company drives, applications, shortlists, offers, and placement analytics in one dashboard.',
      buttonText: 'Explore University Portal'
    },
    {
      title: 'STUDENT',
      tagline: 'Personal Udyoog Workspace',
      desc: 'Discover relevant opportunities, verify your eligibility instantly, and track where you are in the application pipeline.',
      buttonText: 'Explore Student Workspace'
    },
    {
      title: 'EMPLOYER',
      tagline: 'Recruitment Intelligence',
      desc: 'Create opportunities, define custom eligibility requirements, view candidate profiles, and run recruitment stages.',
      buttonText: 'Explore Employer Portal'
    }
  ]
};

export const careerJourneyData = {
  badge: 'Opportunity Pipeline Status',
  heading: 'The Opportunity Status System',
  subheading: 'Know exactly what you applied for, where you are, and what comes next.',
  steps: [
    { title: 'Saved', desc: 'Bookmarks' },
    { title: 'Applied', desc: 'Submitted' },
    { title: 'Assessment', desc: 'Test Phase' },
    { title: 'Shortlisted', desc: 'Passed Review' },
    { title: 'Interview', desc: 'Live Panel' },
    { title: 'Offer Received', desc: 'Offer Sent' },
    { title: 'Placed', desc: 'Selected' }
  ]
};

export const whyUdyogData = {
  badge: 'Placement Intelligence',
  heading: 'Streamlining Placements',
  subheading: 'Eliminate fragmented communication and replace manual tracking with insights.',
  features: [
    {
      title: 'No More Fragmentation',
      desc: 'Unified workspaces.',
      subDesc: 'Replace spreadsheets, forms, scattered emails, and messaging groups with a single system of record.'
    },
    {
      title: 'Instant Eligibility Checks',
      desc: 'Clear, automatic filters.',
      subDesc: 'Students instantly see if they qualify; placement teams bypass manual academic verification.'
    },
    {
      title: 'Real-Time Pipeline Status',
      desc: 'Track every single stage.',
      subDesc: 'Instantly view whether a student is in assessment, shortlisted, interviewing, or offered.'
    },
    {
      title: 'Placement Analytics',
      desc: 'Decision-making insights.',
      subDesc: 'Department-wise hiring, company hiring conversion, and role-wise performance reports for administrators.'
    }
  ],
  summaryCard: {
    badge: 'Institutional Vision',
    title: 'A Udyoog Operating System',
    desc: 'Udyoog is far more than a placement tool. It serves as a unified Udyoog operating system connecting university training, companies, drives, and student outcomes in one system.',
    stats: [
      { value: '1,240', label: 'Students' },
      { value: '1,010', label: 'Eligible Profiles' },
      { value: '285', label: 'Offers Generated' }
    ]
  }
};

export const ctaData = {
  badge: 'Get Started',
  heading: 'Build Your Udyoog Operating System.',
  description: 'Connect universities, students, and employers in a single opportunity pipeline.',
  btnLabel: 'Launch Udyoog'
};

export const footerData = {
  tagline: 'Education to Opportunity, Opportunity to Outcomes.',
  description: 'A connected university and Udyoog ecosystem bridging institutions, students, and employers.',
  copyright: '© 2026 Udyoog. All rights reserved.',
  designedBy: 'NARAATRAL University & Udyoog Ecosystem',
  columns: {
    platform: {
      title: 'Platform',
      links: [
        { label: 'Home', id: 'home' },
        { label: 'About', id: 'about' },
        { label: 'Opportunities', id: 'pathways' },
        { label: 'Placement Lifecycle', id: 'how-it-works' }
      ]
    },
    account: {
      title: 'Account',
      links: [
        { label: 'Get Started', path: '/auth' }
      ]
    },
    support: {
      title: 'Support',
      links: [
        { label: 'Contact Support', path: '/auth' },
        { label: 'Privacy Policy', path: '#' },
        { label: 'Terms of Service', path: '#' }
      ]
    }
  }
};
