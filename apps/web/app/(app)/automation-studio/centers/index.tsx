import React from 'react';
import { BaseGenerationCenter } from './BaseGenerationCenter';
import { Notebook, ListChecks, Book, FileText, Code, Terminal, BarChart, Database } from 'lucide-react';

const genericTemplates = [
  { id: '1', name: 'Quick Summary', description: 'A short overview', icon: FileText, config: {} },
  { id: '2', name: 'Detailed Notes', description: 'Comprehensive notes', icon: Notebook, config: {} }
];

export const StudyCenter = ({ sources }: { sources: any[] }) => (
  <BaseGenerationCenter
    moduleName="Study Center"
    moduleDescription="Generate comprehensive study notes, flashcards, and summaries."
    sources={sources}
    templates={[
      { id: '1', name: 'Detailed Notes', description: 'Comprehensive study notes with bullet points.', icon: Notebook, config: {} },
      { id: '2', name: 'Revision Notes', description: 'Short and concise notes for quick revision.', icon: FileText, config: {} },
      { id: '3', name: 'Flashcards', description: 'Q&A pairs for active recall.', icon: ListChecks, config: {} }
    ]}
    wizardConfig={{
      steps: [
        {
          id: 'config',
          label: 'Configuration',
          fields: [
            { name: 'title', label: 'Title', type: 'text', placeholder: 'e.g. Biology Chapter 1' },
            { name: 'detailLevel', label: 'Detail Level', type: 'select', options: ['High', 'Medium', 'Low'] }
          ]
        }
      ]
    }}
  />
);

export const LessonPlanner = ({ sources }: { sources: any[] }) => (
  <BaseGenerationCenter
    moduleName="Lesson Planner"
    moduleDescription="Create structured lesson plans and schedules."
    sources={sources}
    templates={[
      { id: '1', name: 'One Day Plan', description: 'Detailed plan for a single day.', icon: Book, config: {} },
      { id: '2', name: 'One Week Plan', description: 'Weekly overview and daily breakdown.', icon: ListChecks, config: {} },
      { id: '3', name: 'Exam Planner', description: 'Study plan leading up to an exam.', icon: FileText, config: {} }
    ]}
    wizardConfig={{
      steps: [
        {
          id: 'config',
          label: 'Configuration',
          fields: [
            { name: 'title', label: 'Topic/Title', type: 'text', placeholder: 'e.g. World War II' },
            { name: 'duration', label: 'Duration (Days)', type: 'number', placeholder: 'e.g. 5' },
            { name: 'dailyHours', label: 'Daily Hours', type: 'number', placeholder: 'e.g. 2' },
            { name: 'difficulty', label: 'Difficulty', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
            { name: 'examDate', label: 'Next Exam Date (Optional)', type: 'text', placeholder: 'YYYY-MM-DD' }
          ]
        }
      ]
    }}
  />
);

export const QuestionPaperCenter = ({ sources }: { sources: any[] }) => (
  <BaseGenerationCenter
    moduleName="Question Papers"
    moduleDescription="Generate question papers and marking schemes."
    sources={sources}
    templates={[
      { id: '1', name: 'Unit Test', description: 'Short 20-30 mark test.', icon: FileText, config: {} },
      { id: '2', name: 'Mid Term', description: 'Standard 50 mark exam.', icon: FileText, config: {} },
      { id: '3', name: 'Surprise Test', description: 'Quick, unexpected test on recent topics.', icon: FileText, config: {} },
      { id: '4', name: 'Weekly Test', description: 'End of week assessment.', icon: FileText, config: {} }
    ]}
    wizardConfig={{
      steps: [
        {
          id: 'config',
          label: 'Configuration',
          fields: [
            { name: 'title', label: 'Exam Title', type: 'text', placeholder: 'e.g. Physics Mid Term' },
            { name: 'totalMarks', label: 'Total Marks', type: 'number', placeholder: 'e.g. 50' },
            { name: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard'] },
            { name: 'blueprint', label: 'Blueprint', type: 'text', placeholder: 'e.g. 10 MCQs, 5 Short, 2 Long' }
          ]
        }
      ]
    }}
  />
);

export const RepositoryCenter = ({ sources }: { sources: any[] }) => (
  <BaseGenerationCenter
    moduleName="Repository Center"
    moduleDescription="Generate code reports and documentation from repositories."
    sources={sources}
    templates={[
      { id: '1', name: 'API Docs', description: 'REST/GraphQL API documentation.', icon: Terminal, config: {} },
      { id: '2', name: 'Release Notes', description: 'Changelog and release summaries.', icon: Code, config: {} }
    ]}
    wizardConfig={{
      steps: [
        {
          id: 'config',
          label: 'Configuration',
          fields: [
            { name: 'title', label: 'Project Name', type: 'text' },
            { name: 'branch', label: 'Branch', type: 'text', placeholder: 'e.g. main' },
            { name: 'outputType', label: 'Output Type', type: 'select', options: ['API Docs', 'Architecture', 'Release Notes'] }
          ]
        }
      ]
    }}
  />
);

export const ReportsCenter = ({ sources }: { sources: any[] }) => (
  <BaseGenerationCenter
    moduleName="Reports Center"
    moduleDescription="Generate analytical reports and dashboards."
    sources={sources}
    templates={[
      { id: '1', name: 'Daily Report', description: 'Daily summary report.', icon: BarChart, config: {} },
      { id: '2', name: 'Executive Summary', description: 'High-level business overview.', icon: Database, config: {} }
    ]}
    wizardConfig={{
      steps: [
        {
          id: 'config',
          label: 'Configuration',
          fields: [
            { name: 'title', label: 'Report Title', type: 'text' },
            { name: 'dateRange', label: 'Date Range', type: 'select', options: ['Today', 'This Week', 'This Month', 'Custom'] },
            { name: 'sql', label: 'Custom SQL (Optional)', type: 'text', placeholder: 'SELECT * FROM...' }
          ]
        }
      ]
    }}
  />
);

export const GenericCenter = ({ moduleName, sources }: { moduleName: string, sources: any[] }) => (
  <BaseGenerationCenter
    moduleName={moduleName}
    moduleDescription={`Manage and generate ${moduleName}s.`}
    sources={sources}
    templates={genericTemplates}
    wizardConfig={{
      steps: [
        {
          id: 'config',
          label: 'Configuration',
          fields: [
            { name: 'title', label: 'Title', type: 'text' },
            { name: 'instructions', label: 'Specific Instructions', type: 'text', placeholder: 'Any special requirements...' }
          ]
        }
      ]
    }}
  />
);
