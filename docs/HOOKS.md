## Hooks Usage

### Minimal

Pre-commit:  
✅ ESLint (staged files)  
✅ Prettier (auto-fix)  
✅ Type check  
✅ Commit message validation  
  
Pre-push:  
✅ Full test suite  
✅ Build  
✅ Security audit  

### Complete (Production)

Pre-commit:  
✅ ESLint (staged files)  
✅ Prettier (auto-fix)  
✅ Type check (quick)  
✅ Spell check  
✅ Debug code detection  
✅ Commit message validation  
  
Pre-push:  
✅ Full test suite with coverage  
✅ Build verification  
✅ Security audit  
✅ Bundle size analysis  
✅ Integration tests  
✅ Merge conflict check  

CI/CD:  
✅ All above checks  
✅ E2E tests  
✅ Coverage reporting  
✅ Performance monitoring  
✅ Deployment  


## Summary Table

|Task|Pre-Commit|Pre-Push|CI/CD|
|----|----------|--------|-----|
|Lint|✅ Staged only|✅ Full|✅ Full|
|Format|✅ Auto-fix|⚠️ Optional|✅ Check|
|Type check|✅ Quick|✅ Full|✅ Full|
|Tests|❌ No|✅ Unit|✅ All|
|Build|❌ No|✅ Yes|✅ Yes|
|Security|❌ No|✅ Audit|✅ Scan|
|Bundle size|❌ No|✅ Check|✅ Track|
|Integration tests|❌ No|✅ Yes|✅ Yes|
|E2E tests|❌ No|❌ No|✅ Yes|
|Coverage|❌ No|⚠️ Optional|✅ Report|

  