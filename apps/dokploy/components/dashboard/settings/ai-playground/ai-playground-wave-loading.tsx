import { motion } from 'framer-motion'

export const AiPlaygroundWaveLoading = () => {
    return (
        <div className="flex items-center justify-center space-x-1">
            {[0, 1, 2].map((index) => (
                <motion.span
                    key={index}
                    className="w-1 h-1 bg-current"
                    style={{ borderRadius: '9999px' }}
                    animate={{
                        y: ['0%', '-80%', '0%']
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatType: 'loop',
                        ease: 'easeInOut',
                        delay: index * 0.2
                    }}
                >
                </motion.span>
            ))}
        </div>
    );
};
