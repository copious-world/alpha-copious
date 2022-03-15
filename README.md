# alpha-copious
----------------

**included or subsituted code** 

**Purpose:**
> ***ground truth for rolling base code and components into templates and server side processes***


All directories, config files and tools, found here allow for selective workflows and minimal code choices for static targets. 

This workflow for *site hosted static pages* is a two step process (phases):

**1)** The amount of code and styling required for a page common to more than one site is determind (per config file) for a particular type of static page. <u>**The static template page is generated**</u>.

**2)** Particular URLS which will host the pages will have custom content, labels, and icons. <u>**The final static page is generated and deposited in a prestaging directory**</u>.

Other workflows for placing common code into server side or client side may be found here as well. Some tools for config file generation may be found here. And, some code for publishing to servers may be found here.

Directories include tested (ideally) code snippets that may be selectively pulled into template pages in order to include minimally sufficient functionality for small static pages.


## pre-template-configs

Pre-template configurations are configurations that allow for selecting code that should occur in a page for it to function. JSON and very high level markup may be used to express the selections of components. 

Input files may contain more than one possible function or markup for selection. Hence tools, read these files and parse them. Output specification will have a set of keys available for use in configuration, where the keys will be originally defined in the source files.

In essense the files in the source directories are like small databases, but they are in files for passing into a test program.

## pre-template variables

A distinction is made between pre-template variables and template variables. 

The variables remaining in the first phase output will agree with *Moustache* style template variables.

Pretemplate variables will be those that start with **$$** and are followed by a standard identifier string.

E.g.

```
Put this in the code here: $$CODE_INSERT
```



