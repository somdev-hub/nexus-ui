export interface User {
    id: string;
    personalEmail: string;
    name: string;
    phone: string;
    role: string;
    avatar?: string;
}

export interface ApplicantEducation {
    applicantEducationId?: number;
    institute: string;
    degree: string;
    city: string;
    state: string;
    country: string;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
}

export interface ApplicantExperience {
    applicantExperienceId?: number;
    previousCompany: string;
    jobTitle: string;
    yearsOfExperience: number;
    jobDescription: string;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
}

export interface ApplicantSkill {
    applicantSkillId?: number;
    skillName: string;
    isActive?: boolean;
}

export interface ApplicantDocument {


    hrDocumentId?: number;
    documentName: string;
    hrDocumentType: string;
    documentUrl: string;
    createdOn?: Date;
    isActive?: boolean;
}

export interface Applicant {

    applicantId?: number;
    applicantFirstName: string;
    applicantLastName: string;
    applicantEmail: string;
    applicantPhone: string;
    applicantGender: string;
    applicantDateOfBirth: string;
    applicantAge: number;
    applicantAddress: string;
    applicantCity: string;
    applicantState: string;
    applicantCountry: string;
    applicantPinCode: string;
    applicantEducations: ApplicantEducation[];
    applicantExperiences: ApplicantExperience[];
    applicantSkills: ApplicantSkill[];
    applicantDocuments: ApplicantDocument[];
}