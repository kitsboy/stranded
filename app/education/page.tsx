import dynamic from 'next/dynamic'

const EducationContent = dynamic(() => import('@/components/EducationContent'), {
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-gray-400">
      Loading Education Center…
    </div>
  ),
})

export const metadata = {
  title: 'Education Center | Stranded Value',
  description: 'Simulators, real generators, per-site ROI, quiz, and Stranded Value toolkit.',
  openGraph: { title: 'Stranded Education Center', images: ['/images/3.jpg'] },
}

export default function EducationPage() {
  return <EducationContent />
}