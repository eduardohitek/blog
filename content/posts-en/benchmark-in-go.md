---
title: "Performing Benchmark Tests in Go"
date: 2021-07-31T21:02:04-03:00
draft: false
cover: "/images/go-benchmark/1.jpg"
coverAlt: "Performing Benchmark Tests in Go"
coverCaption: "How to check if this function is faster or not"
tags: ["golang", "tutorial", "tests"]
categories: ["golang", "tutorial", "tests"]
---

Benchmark testing in programming is the act of efficiently comparing performance between algorithms in order to choose which approach to follow in certain scenarios. We can also apply when deciding which external libraries or frameworks to use, in addition to evaluating if any refactoring will bring harm to our code.

The Go language already has tools for these types of tests by default, making the experience more user-friendly and without the need for external tools.

Let's see how to verify this in practice.

### Analyzing Palindromic Verification Performance

Palindrome is a word or group of words that have linear symmetry, that is, they remain the same when read backwards. A more common example is the word `level` or `anna` where the reading order does not change the meaning of the word. We can also obtain this effect by combining a few words, forming simple sentences like: `never odd or even`.

It is quite common in job interviews that you are faced with the challenge of writing an algorithm to check whether a phrase or word is palindrome or not.

For examples I used 3 different algorithms to analyze which will have the best performance:

1) **PalindromeReverse**: receives a string, reverses it and checks if the 2 strings are equal.
```
func reverse(s string) string {
   runes := []rune(s)
   for i, j := 0, len(runes)-1; i<j; i, j = i+1, j-1 {
       runes[i], runes[j] = runes[j], runes[i]
   }
   return string(runes)
}

func palindromeReverse(str string) bool {
   strReversed := reverse(str)
   return strReversed == str
}
```
2) **PalindromeFromEnd**: cycles through the string comparing the 1st word with the last and so on.
```
func palindromeFromEnd(str string) bool {
   runes := []rune(str)
   length := len(runes)
   for i := 0; i < length; i++ {
       if runes[i] != runes[length-1-i] {
           return false
       }
   }
   return true
}
```
1) **palindromeFromMiddle**: runs from the middle characters to the beginning/end of the string.
```
func palindromeFromMiddle(str string) bool {
   runes := []rune(str)
   length := len(runes)
   middleI, middleJ := (length/2)-1, (length/2)+1
   if length%2 == 0 {
       middleJ -= 1
   }

   for i, j := middleI, middleJ; i >= 0; i, j = i-1, j+1 {
       if runes[i] != runes[j] {
           return false
       }
   }
   return true
}
```

With the functions created, now we need to write the Benchmark Tests functions.

### Benchmark Tests

In our example, let's create the test file `main_test.go` and within it create the following test functions:
```
func BenchmarkPalindromeFromMiddle_Banana(b *testing.B) {
   for n := 0; n<b.N; n++ {
       palindromeFromMiddle("banana")
   }
}
func BenchmarkPalindromeReverse_Banana(b *testing.B) {
   for n := 0; n<b.N; n++ {
       palindromeReverse("banana")
   }
}
func BenchmarkPalindromeFromEnd_Banana(b *testing.B) {
   for n := 0; n<b.N; n++ {
       palindromeFromEnd("banana")
   }
}
```

Here we are asking Go to run each of the functions with the `banana` string. Next step is to run the following command in the terminal: `go test -bench=. -benchtime=1s`
```
~/dev/eduardohitek/go-benchmark-example main*
❯ go test -bench=. -benchtime=1s
goos: darwin
goarch: amd64
pkg: github.com/eduardohitek/go-benchmark-example
cpu: Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz
BenchmarkPalindromeFromMiddle_Banana-12 69054604 16.36 ns/op
BenchmarkPalindromeReverse_Banana-12 16145308 69.83 ns/op
BenchmarkPalindromeFromEnd_Banana-12 91725068 15.84 ns/op
PASS
ok github.com/eduardohitek/go-benchmark-example 4.563s
```

Following the argument we informed, each benchmark function is executed for 1 second and we have 2 pieces of information for each: Number of executions and average time of each execution. For this example of a non-palindromic word, and when the difference was between the 1st and the last letter, the **BenchmarkPalindromeFromEnd_Banana** was more performant because it had a lower average time per operation.

In the next example we use a word major palindrome (*nomelgibsonisacasinosbiglemon*):
```
~/dev/eduardohitek/go-benchmark-example main*
❯ go test -bench=. -benchtime=1s
goos: darwin
goarch: amd64
pkg: github.com/eduardohitek/go-benchmark-example
cpu: Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz
BenchmarkPalindromeFromMiddle_nomelgibsonisacasinosbiglemon-12 18193920 56.29 ns/op
BenchmarkPalindromeReverse_nomelgibsonisacasinosbiglemon-12 4255890 272.6 ns/op
BenchmarkPalindromeFromEnd_nomelgibsonisacasinosbiglemon-12 16961797 63.68 ns/op
PASS
ok github.com/eduardohitek/go-benchmark-example 5.078s

```


In this example the **BenchmarkPalindromeFromMiddle** came out ahead. The last test uses a much longer string (+800 characters) and we confirm which function does better in this scenario:

```
~/dev/eduardohitek/go-benchmark-example main*
❯ go test -bench=. -benchtime=1s
goos: darwin
goarch: amd64
pkg: github.com/eduardohitek/go-benchmark-example
cpu: Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz
BenchmarkPalindromeFromMiddle_longstring-12 672807 1774 ns/op
BenchmarkPalindromeReverse_longstring-12 141945 7784 ns/op
BenchmarkPalindromeFromEnd_longstring-12 524437 2121 ns/op
PASS
ok github.com/eduardohitek/go-benchmark-example 5.006s
```

So we could see how easy it is to perform this type of tests to assess the changes and performance of algorithms in Go applications.

All source code for the examples is found [here](https://github.com/eduardohitek/go-benchmark-example).
