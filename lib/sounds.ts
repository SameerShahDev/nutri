import { Howl } from 'howler';

export const playClickSound = () => {
  try {
    const sound = new Howl({
      src: ['/sounds/click.mp3'],
      volume: 0.5,
    });
    sound.play();
  } catch (error) {
    console.error('Click sound error:', error);
  }
};

export const playSuccessSound = () => {
  try {
    const sound = new Howl({
      src: ['/sounds/success.mp3'],
      volume: 0.6,
    });
    sound.play();
  } catch (error) {
    console.error('Success sound error:', error);
  }
};

export const playErrorSound = () => {
  try {
    const sound = new Howl({
      src: ['/sounds/error.mp3'],
      volume: 0.3,
    });
    sound.play();
  } catch (error) {
    // Sound files not available, silently fail
  }
};

export const playNotificationSound = () => {
  try {
    const sound = new Howl({
      src: ['/sounds/notification.mp3'],
      volume: 0.5,
    });
    sound.play();
  } catch (error) {
    // Sound files not available, silently fail
  }
};

export const playGulpSound = () => {
  try {
    const sound = new Howl({
      src: ['/sounds/gulp.mp3'],
      volume: 0.5,
    });
    sound.play();
  } catch (error) {
    // Sound files not available, silently fail
  }
};

export const playCashSound = () => {
  try {
    const sound = new Howl({
      src: ['/sounds/cash.mp3'],
      volume: 0.4,
    });
    sound.play();
  } catch (error) {
    // Sound files not available, silently fail
  }
};

export const playPremiumCashSound = () => {
  try {
    const sound = new Howl({
      src: ['/sounds/premium-cash.mp3'],
      volume: 0.9,
    });
    sound.play();
  } catch (error) {
    // Sound files not available, silently fail
  }
};

export const playGoalChimeSound = () => {
  try {
    const sound = new Howl({
      src: ['/sounds/goal-chime.mp3'],
      volume: 0.8,
    });
    sound.play();
  } catch (error) {
    // Sound files not available, silently fail
  }
};
