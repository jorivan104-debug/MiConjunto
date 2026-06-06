import { motion } from 'framer-motion'
import { BrandLogo } from './BrandLogo'

export function SplashScreen({ message = 'Cargando tu comunidad...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <BrandLogo variant="full" className="h-32 md:h-40" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-6 text-sm text-ink-500"
      >
        {message}
      </motion.p>
      <motion.div
        className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-ink-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="h-full bg-brand-blue"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          style={{ width: '60%' }}
        />
      </motion.div>
    </div>
  )
}

export default SplashScreen
