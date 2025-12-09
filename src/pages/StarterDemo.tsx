import { useState } from "react";
import { Link } from "react-router-dom";
import { GameContainer } from "@/components/layout/GameContainer";
import { ChildFriendlyNav } from "@/components/layout/ChildFriendlyNav";
import { QuizCard } from "@/components/edu/QuizCard";
import { FlashCard } from "@/components/edu/FlashCard";
import { ProgressBar } from "@/components/edu/ProgressBar";
import { Timer } from "@/components/edu/Timer";
import { SuccessAnimation } from "@/components/feedback/SuccessAnimation";
import { ScoreDisplay } from "@/components/feedback/ScoreDisplay";
import { RewardBadge } from "@/components/feedback/RewardBadge";
import { StreakCounter } from "@/components/feedback/StreakCounter";
import { useScore } from "@/hooks/useScore";
import { mathQuestions } from "@/data/mathQuestions";
import { swedishWords } from "@/data/swedishWords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, BookOpen, Calculator, Trophy } from "lucide-react";

export default function StarterDemo() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const { score, addPoints, resetScore } = useScore({ saveToStorage: true, storageKey: "demo-score" });

  const questions = mathQuestions.slice(0, 5);
  const cards = swedishWords.slice(0, 5);

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      addPoints(10);
      setStreak((prev) => prev + 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } else {
      setStreak(0);
    }
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      }
    }, 1200);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setStreak(0);
    resetScore();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <ChildFriendlyNav 
        title="Skolappar Startmall" 
        showBack={true}
        backTo="/"
        rightContent={<ScoreDisplay score={score} size="sm" />}
      />
      
      <GameContainer fullHeight={false}>
        <div className="py-8 space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
              Pedagogiska Komponenter
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              En samling färdiga komponenter för att bygga lärorika appar tillsammans med dina barn.
            </p>
          </div>

          <Tabs defaultValue="quiz" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quiz" className="gap-2">
                <Calculator className="w-4 h-4" />
                Quiz
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Glosor
              </TabsTrigger>
              <TabsTrigger value="components" className="gap-2">
                <Trophy className="w-4 h-4" />
                Komponenter
              </TabsTrigger>
            </TabsList>

            {/* Quiz Tab */}
            <TabsContent value="quiz" className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <ProgressBar 
                  current={currentQuestion + 1} 
                  total={questions.length} 
                  className="flex-1 mr-4"
                />
                <StreakCounter count={streak} milestone={3} />
              </div>

              {currentQuestion < questions.length ? (
                <QuizCard
                  question={questions[currentQuestion].question}
                  options={questions[currentQuestion].options}
                  correctIndex={questions[currentQuestion].correctIndex}
                  difficulty={questions[currentQuestion].difficulty}
                  onAnswer={handleAnswer}
                />
              ) : (
                <Card className="text-center p-8">
                  <CardContent className="space-y-4">
                    <h2 className="text-2xl font-heading font-bold">Bra jobbat! 🎉</h2>
                    <ScoreDisplay score={score} maxScore={questions.length * 10} showPercentage size="lg" />
                    <Button onClick={resetQuiz} className="gap-2">
                      Spela igen <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Flashcards Tab */}
            <TabsContent value="flashcards" className="space-y-6 pt-6">
              <ProgressBar current={currentCard + 1} total={cards.length} />
              
              <FlashCard
                front={cards[currentCard].front}
                back={cards[currentCard].back}
              />
              
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentCard((prev) => Math.max(0, prev - 1))}
                  disabled={currentCard === 0}
                >
                  Föregående
                </Button>
                <Button
                  onClick={() => setCurrentCard((prev) => Math.min(cards.length - 1, prev + 1))}
                  disabled={currentCard === cards.length - 1}
                >
                  Nästa
                </Button>
              </div>
            </TabsContent>

            {/* Components Showcase */}
            <TabsContent value="components" className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Timer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Timer</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Timer initialTime={30} autoStart={false} />
                  </CardContent>
                </Card>

                {/* Score Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Poängvisning</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ScoreDisplay score={85} maxScore={100} showPercentage />
                  </CardContent>
                </Card>

                {/* Streak Counter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Svarssvit</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <StreakCounter count={5} milestone={5} />
                  </CardContent>
                </Card>

                {/* Progress Bar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Framsteg</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProgressBar current={7} total={10} color="success" animated />
                  </CardContent>
                </Card>
              </div>

              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Belöningsmärken</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap justify-center gap-4">
                  <RewardBadge type="bronze" label="Nybörjare" unlocked size="sm" />
                  <RewardBadge type="silver" label="Duktigt!" unlocked size="sm" />
                  <RewardBadge type="gold" label="Stjärna" unlocked size="sm" />
                  <RewardBadge type="platinum" label="Mästare" unlocked={false} size="sm" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Link back */}
          <div className="text-center pt-8">
            <Link to="/">
              <Button variant="outline" size="lg">
                Tillbaka till startsidan
              </Button>
            </Link>
          </div>
        </div>
      </GameContainer>

      {showSuccess && <SuccessAnimation type="confetti" />}
    </div>
  );
}
