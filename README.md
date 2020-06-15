# Your Task

You are developing a program for NotAScam Inc., a multi-level marketing company. 
The company has a database of its sales associates and sales that each associate makes. 
Associates earn a 10% commission on all of their sales, 
but must pay half of their commission to the associate who recruited them. 
In turn, the recruiter must pay half of their commission to the associate 
who recruited them (if applicable), up to the top of the chain.  
This company is asking you to build a program that will output the total sales amount and 
total net commission earned by each associate in a given month.
 
Please write a program that computes these commissions. 
If you can write Go, we would prefer that, 
but any language you’re comfortable with is fine. We’re looking for a simple command-line program here.

# My Solution

## Assumption:

All data is clean, not dirty. 
1. There is no any circle relationship in DB.
2. There is no null or illegal number in DB. 
3. For the toppest associate/CEO/President, his/her recruiter ID is "#".
4. There is no any repeat data in DB. 


## Thinking Process/Solution: 

1. The relationship between associates and recruiters are multi-level tree; each node is a associate and 
each recruiter is also an associate. The top of tree is also an associate; the only difference is that this associate 
doesn't have a recruiter. 

So for NotAScam Inc.'s database, it might looks like this:
![DB Info](https://drive.google.com/file/d/1mEKLZ18hQFuE8NrtQkHJtqiFUYMMHHqw/view?usp=sharing)

And its graph looks like this:
![Graph Info](https://drive.google.com/file/d/1d0w6I-gvw76HE72GpcVibWfzAIQsxDsi/view?usp=sharing)

2. According to the rule of computing commissions, we can use BFS to visit the Tree and calculate the commission. 
We use a queue to store all bottom associates and calculate their commissions. And then when one recruiter's all associates f
finish the update of commission, we start to push this recruiter to queue. This is bottom to up visit method. 

# Test Cases:

1. balance tree 
![Use Case-1](https://drive.google.com/file/d/17nn9OBzxPWsw_LZMAC8Qr4cXJXlB9DFn/view?usp=sharing)

2. unbalance tree
![Use Case-2](https://drive.google.com/file/d/1xAPH_VGULyXaK1igoVkQhz-wI5UsE_O3/view?usp=sharing)
